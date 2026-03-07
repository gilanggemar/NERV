/**
 * openclawToolParser.ts
 *
 * Parses inline tool call markup from OpenClaw Gateway chat event content.
 *
 * The Gateway embeds tool calls in the message text using delimiters:
 *   - Unicode PUA: U+100085 (open) and U+100086 (close)
 *   - OR angle brackets: < and >
 *   - OR NO delimiters (just `call:ToolName{...}` in the text)
 *
 * Format:
 *   <OPEN>call:ToolName<CLOSE>{json}<OPEN>/call:ToolName<CLOSE>
 *   <OPEN>response:ToolName<CLOSE>{json}<OPEN>/response:ToolName<CLOSE>
 *
 * This parser handles ALL delimiter variants and uses brace-counting
 * for JSON extraction (no lazy regex matching).
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface ToolCallBlock {
    id: string;
    toolName: string;
    status: "running" | "completed" | "error";
    input: Record<string, any>;
    output: Record<string, any> | null;
    startedAt: number;
    completedAt: number | null;
}

export interface ParseResult {
    toolCalls: ToolCallBlock[];
    cleanedText: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const OPEN_PUA = String.fromCodePoint(0x100085);
const CLOSE_PUA = String.fromCodePoint(0x100086);

// ─── Main Parser ────────────────────────────────────────────────────

export function parseOpenClawToolCalls(rawContent: string): ParseResult {
    if (!rawContent || typeof rawContent !== "string") {
        return { toolCalls: [], cleanedText: rawContent || "" };
    }

    // Strategy 1: Try call:/response: markup (PUA delimiters, angle brackets, bare)
    const blocks = extractAllBlocks(rawContent);

    if (blocks.length > 0) {
        blocks.sort((a, b) => a.startPos - b.startPos);

        const callBlocks = blocks.filter((b) => b.blockType === "call");
        const responseBlocks = blocks.filter((b) => b.blockType === "response");
        const toolCalls: ToolCallBlock[] = [];

        for (const call of callBlocks) {
            const responseIdx = responseBlocks.findIndex(
                (r) => r.toolName === call.toolName && r.startPos > call.endPos
            );
            let response: RawBlock | undefined;
            if (responseIdx !== -1) {
                response = responseBlocks[responseIdx];
                responseBlocks.splice(responseIdx, 1);
            }

            let inputJson: Record<string, any> = {};
            let outputJson: Record<string, any> | null = null;
            let status: "running" | "completed" | "error" = "running";

            try { inputJson = JSON.parse(call.jsonBody); } catch { inputJson = { _raw: call.jsonBody }; }

            if (response) {
                try { outputJson = JSON.parse(response.jsonBody); } catch { outputJson = { _raw: response.jsonBody }; }
                const hasError = outputJson &&
                    (outputJson.error || (outputJson.exitCode !== undefined && outputJson.exitCode !== 0));
                status = hasError ? "error" : "completed";
            }

            toolCalls.push({
                id: `tc-${call.toolName.toLowerCase()}-${call.startPos}`,
                toolName: call.toolName,
                status,
                input: inputJson,
                output: outputJson,
                startedAt: Date.now(),
                completedAt: status !== "running" ? Date.now() : null,
            });
        }

        let cleanedText = rawContent;
        const allBlocks = [...blocks].sort((a, b) => b.startPos - a.startPos);
        for (const block of allBlocks) {
            cleanedText = cleanedText.substring(0, block.startPos) + cleanedText.substring(block.endPos);
        }
        cleanedText = cleanedText.replace(/\n{3,}/g, "\n\n").trim();

        return { toolCalls, cleanedText };
    }

    // Strategy 2: Parse JSON code blocks with {"call": "...", "arguments": {...}} format
    // This is the actual format used by OpenClaw gateway in webchat mode
    const jsonBlockResult = parseJsonCodeBlockTools(rawContent);
    if (jsonBlockResult.toolCalls.length > 0) {
        return jsonBlockResult;
    }

    return { toolCalls: [], cleanedText: rawContent };
}

// ─── Block Extractor ────────────────────────────────────────────────

interface RawBlock {
    blockType: "call" | "response";
    toolName: string;
    jsonBody: string;
    startPos: number;
    endPos: number;
}

function extractAllBlocks(text: string): RawBlock[] {
    const blocks: RawBlock[] = [];
    let i = 0;

    while (i < text.length) {
        const tag = matchOpeningTag(text, i);
        if (!tag) { i++; continue; }

        // Find JSON body after the tag
        let jsonStart = tag.tagEndPos;
        while (jsonStart < text.length && /\s/.test(text[jsonStart])) jsonStart++;

        let jsonBody = "";
        let afterJson = jsonStart;

        if (jsonStart < text.length && text[jsonStart] === "{") {
            const extracted = extractBalancedBraces(text, jsonStart);
            if (extracted) {
                jsonBody = extracted.content;
                afterJson = extracted.endPos;
            }
        }

        // Find closing tag
        const closingTag = findClosingTag(text, afterJson, tag.blockType, tag.toolName);
        const blockEnd = closingTag ? closingTag.endPos : afterJson;

        blocks.push({
            blockType: tag.blockType,
            toolName: tag.toolName,
            jsonBody,
            startPos: i,
            endPos: blockEnd,
        });

        i = blockEnd;
    }

    return blocks;
}

function matchOpeningTag(text: string, i: number): {
    blockType: "call" | "response"; toolName: string; tagEndPos: number;
} | null {
    const cp = text.codePointAt(i);
    if (!cp) return null;

    let delimLen: number;

    if (cp === 0x100085) {
        delimLen = 2;  // surrogate pair
    } else if (cp === 0x3C) {  // <
        delimLen = 1;
    } else {
        // Also try bare "call:" or "response:" without delimiters
        const bareMatch = text.substring(i).match(/^(call|response):([a-zA-Z0-9_]+)/);
        if (bareMatch) {
            const afterName = i + bareMatch[0].length;
            return {
                blockType: bareMatch[1] as "call" | "response",
                toolName: bareMatch[2],
                tagEndPos: afterName,
            };
        }
        return null;
    }

    const afterOpen = i + delimLen;
    const rest = text.substring(afterOpen);
    const m = rest.match(/^(call|response):([a-zA-Z0-9_]+)/);
    if (!m) return null;

    const afterName = afterOpen + m[0].length;
    const closeCp = text.codePointAt(afterName);
    if (!closeCp) return null;

    let closeLen: number;
    if (closeCp === 0x100086) closeLen = 2;
    else if (closeCp === 0x3E) closeLen = 1;  // >
    else closeLen = 0; // No closing delimiter — still valid for bare tags

    return {
        blockType: m[1] as "call" | "response",
        toolName: m[2],
        tagEndPos: afterName + closeLen,
    };
}

function findClosingTag(
    text: string, from: number, blockType: string, toolName: string
): { endPos: number } | null {
    const patterns = [
        `${OPEN_PUA}/${blockType}:${toolName}${CLOSE_PUA}`,
        `</${blockType}:${toolName}>`,
    ];
    for (const pat of patterns) {
        const idx = text.indexOf(pat, from);
        if (idx !== -1) return { endPos: idx + pat.length };
    }
    return null;
}

function extractBalancedBraces(text: string, start: number): {
    content: string; endPos: number;
} | null {
    if (text[start] !== "{") return null;
    let depth = 0;
    let inStr = false;
    let esc = false;

    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (esc) { esc = false; continue; }
        if (ch === "\\" && inStr) { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (!inStr) {
            if (ch === "{") depth++;
            else if (ch === "}") {
                depth--;
                if (depth === 0) return { content: text.substring(start, i + 1), endPos: i + 1 };
            }
        }
    }
    return { content: text.substring(start), endPos: text.length };
}

// ─── Strategy 2: JSON Code Block Parser ─────────────────────────────
// Handles the actual OpenClaw format: ```json {"call": "default_api:exec", "arguments": {...}} ```
// Also handles bare JSON objects and tool_result blocks

function parseJsonCodeBlockTools(rawContent: string): ParseResult {
    const toolCalls: ToolCallBlock[] = [];
    const regionsToRemove: { start: number; end: number }[] = [];

    // Pattern 1: JSON inside markdown code blocks: ```json\n{...}\n```
    const codeBlockRegex = /```(?:json)?\s*\n(\{[\s\S]*?\})\s*\n```/g;
    let match;

    while ((match = codeBlockRegex.exec(rawContent)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.call && parsed.arguments) {
                // This is a tool call: {"call": "default_api:exec", "arguments": {...}}
                const rawToolName = parsed.call;
                // Extract clean tool name: "default_api:exec" → "exec"
                const toolName = rawToolName.includes(':') ? rawToolName.split(':').pop() : rawToolName;

                toolCalls.push({
                    id: `tc-${toolName.toLowerCase()}-${match.index}`,
                    toolName,
                    status: "running",
                    input: parsed.arguments,
                    output: null,
                    startedAt: Date.now(),
                    completedAt: null,
                });

                regionsToRemove.push({ start: match.index, end: match.index + match[0].length });
            } else if (parsed.tool_result || parsed.result || parsed.output || parsed.exitCode !== undefined || parsed.stdout !== undefined) {
                // This is a tool result/response
                if (toolCalls.length > 0) {
                    const lastCall = toolCalls[toolCalls.length - 1];
                    if (lastCall.status === "running") {
                        lastCall.output = parsed;
                        const hasError = parsed.error || (parsed.exitCode !== undefined && parsed.exitCode !== 0);
                        lastCall.status = hasError ? "error" : "completed";
                        lastCall.completedAt = Date.now();
                    }
                }
                regionsToRemove.push({ start: match.index, end: match.index + match[0].length });
            }
        } catch { /* not valid JSON, skip */ }
    }

    // Pattern 2: Bare JSON objects (not in code blocks) with "call" field
    if (toolCalls.length === 0) {
        const bareJsonRegex = /(?:^|\n)\s*(\{"call"\s*:\s*"[^"]+"[\s\S]*?\})\s*(?:\n|$)/g;
        while ((match = bareJsonRegex.exec(rawContent)) !== null) {
            try {
                const parsed = JSON.parse(match[1]);
                if (parsed.call && parsed.arguments) {
                    const rawToolName = parsed.call;
                    const toolName = rawToolName.includes(':') ? rawToolName.split(':').pop() : rawToolName;

                    toolCalls.push({
                        id: `tc-${toolName.toLowerCase()}-${match.index}`,
                        toolName,
                        status: "running",
                        input: parsed.arguments,
                        output: null,
                        startedAt: Date.now(),
                        completedAt: null,
                    });

                    regionsToRemove.push({ start: match.index, end: match.index + match[0].length });
                }
            } catch { /* not valid JSON, skip */ }
        }
    }

    // Build cleaned text
    let cleanedText = rawContent;
    if (regionsToRemove.length > 0) {
        regionsToRemove.sort((a, b) => b.start - a.start);
        for (const region of regionsToRemove) {
            cleanedText = cleanedText.substring(0, region.start) + cleanedText.substring(region.end);
        }
        cleanedText = cleanedText.replace(/\n{3,}/g, "\n\n").trim();
    }

    return { toolCalls, cleanedText };
}

// ─── Display Helpers ────────────────────────────────────────────────

export interface ToolDisplayInfo {
    icon: string;          // Lucide icon name
    label: string;         // Human-readable description
    accentColor: string;   // CSS variable or direct color
}

export function getToolDisplayInfo(tc: ToolCallBlock): ToolDisplayInfo {
    const name = tc.toolName.toLowerCase();
    const truncate = (s: string, max = 100) => s && s.length > max ? s.substring(0, max - 1) + "…" : s || "";

    switch (name) {
        case "exec":
            return { icon: "Terminal", label: truncate(tc.input.description || tc.input.cmd || tc.input.command || ""), accentColor: "rgb(251 146 60)" }; // orange-400
        case "read":
            return { icon: "FileText", label: `from ${truncate(tc.input.path || tc.input.file || "")}`, accentColor: "rgb(163 230 53)" }; // lime-400
        case "write": case "edit":
            return { icon: "FilePen", label: `to ${truncate(tc.input.path || tc.input.file || "")}`, accentColor: "rgb(163 230 53)" };
        case "web_search": case "websearch":
            return { icon: "Search", label: truncate(tc.input.query || tc.input.q || ""), accentColor: "rgb(56 189 248)" }; // sky-400
        case "web_fetch": case "webfetch":
            return { icon: "Globe", label: truncate(tc.input.url || ""), accentColor: "rgb(56 189 248)" };
        case "browser":
            return { icon: "Globe", label: truncate(tc.input.action || tc.input.description || "browser"), accentColor: "rgb(167 139 250)" }; // violet-400
        case "message":
            return { icon: "Send", label: `${tc.input.channel || ""} → ${tc.input.to || ""}`.trim(), accentColor: "rgb(251 113 133)" }; // rose-400
        case "apply_patch":
            return { icon: "GitBranch", label: "apply patch", accentColor: "rgb(163 230 53)" };
        case "sessions_spawn":
            return { icon: "GitFork", label: `spawn: ${tc.input.agentId || "?"}`, accentColor: "rgb(251 113 133)" };
        default:
            return { icon: "Wrench", label: tc.toolName, accentColor: "rgb(34 211 238)" }; // cyan-400
    }
}

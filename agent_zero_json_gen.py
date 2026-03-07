from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
import json

@dataclass
class AgentZeroResponse:
    """Struct definition matching internal Agent Zero JSON output."""
    thoughts: List[str]     # Array of reasoning steps
    headline: str           # One-line summary
    tool_name: str          # The tool used (e.g., 'response', 'search_engine')
    tool_args: Dict[str, Any]   # Key-value inputs for the tool
    detail: Optional[str] = ""  # Optional detail/info field

def generate_output(thoughts: List[str], action: str, args: Dict[str, Any], summary: str = "", detail: str = "") -> str:
    response = AgentZeroResponse(
        thoughts=thoughts,
        headline=summary,
        tool_name=action,
        tool_args=args,
        detail=detail
    )
    return json.dumps(asdict(response), indent=2)

# Example Usage
if __name__ == "__main__":
    result = generate_output(
        thoughts=["Analyzing request", "Formatting response"],
        summary="Data Generated",
        action="response",
        args={"text": "Configuring dashboard..."},
        detail="Success ✅"
    )
    print(result)

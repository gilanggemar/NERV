'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { usePromptChunkStore } from '@/store/usePromptChunkStore';
import { PromptChunkColorPicker } from './PromptChunkColorPicker';

const CATEGORIES = ['Uncategorized', 'System Prompts', 'Agent Instructions', 'Templates', 'Formatting', 'Custom'];

export function PromptChunkDialog() {
    const { dialogOpen, closeDialog, editingChunk, createChunk, updateChunk, deleteChunk } = usePromptChunkStore();

    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Uncategorized');
    const [color, setColor] = useState('#6B7280');

    useEffect(() => {
        if (editingChunk) {
            setName(editingChunk.name);
            setContent(editingChunk.content);
            setCategory(editingChunk.category);
            setColor(editingChunk.color);
        } else {
            setName('');
            setContent('');
            setCategory('Uncategorized');
            setColor('#6B7280');
        }
    }, [editingChunk, dialogOpen]);

    const handleSave = async () => {
        if (!name.trim() || !content.trim()) return;
        if (editingChunk) {
            await updateChunk(editingChunk.id, { name: name.trim(), content: content.trim(), color, category });
        } else {
            await createChunk({ name: name.trim(), content: content.trim(), color, category });
        }
    };

    const handleDelete = async () => {
        if (editingChunk) {
            await deleteChunk(editingChunk.id);
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>{editingChunk ? 'Edit Prompt Chunk' : 'Create Prompt Chunk'}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 mt-2">
                    <div>
                        <label className="text-sm font-medium text-white/70 mb-1.5 block">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value.slice(0, 30))}
                            placeholder="e.g., My Style Tags"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-white/70 mb-1.5 block">Content</label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter the text this chunk will expand to..."
                            rows={4}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-white/70 mb-1.5 block">Category</label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-white/70 mb-1.5 block">Color</label>
                        <PromptChunkColorPicker color={color} onChange={setColor} />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!name.trim() || !content.trim()}>
                            Save
                        </Button>
                    </div>

                    {editingChunk && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors mt-1"
                        >
                            <Trash2 size={13} />
                            Delete this chunk
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

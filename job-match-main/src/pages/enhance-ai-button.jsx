"use client"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { enhanceContent } from "../services/ai-service"

export default function EnhanceAIButton({
    contentType,
    content,
    onApplyEnhancement,
    variant = "outline",
    size = "sm",
    className = "",
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [aiResult, setAiResult] = useState(null)
    const [editableEnhancedContent, setEditableEnhancedContent] = useState("")

    const handleEnhance = async () => {
        if (!content.trim()) {
            return
        }

        setIsLoading(true)

        try {
            const response = await enhanceContent(content, contentType)

            const result = await response
            setAiResult(result)
            setEditableEnhancedContent(result.enhanced)
            setIsDialogOpen(true)
        } catch (error) {
            console
                error("Error enhancing content:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const applyEnhancement = () => {
        if (editableEnhancedContent) {
            onApplyEnhancement(editableEnhancedContent)
            setIsDialogOpen(false)
        }
    }

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={`${className} text-purple-700 border-purple-200 hover:bg-purple-50 hover:text-purple-800`}
                onClick={handleEnhance}
                disabled={isLoading || !content.trim()}
            >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Enhance with AI
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-purple-800 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            AI Enhancement Suggestions
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Review the AI-suggested improvements for your content
                        </DialogDescription>
                    </DialogHeader>

                    {aiResult && (
                        <div className="space-y-4 my-4">
                                 <div>
                                <h3 className="font-medium text-gray-900 mb-2">Feedback</h3>
                                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
                                    {aiResult.feedback}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Original</h3>
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-700 text-sm">{content}</div>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Enhanced Version</h3>
                                <textarea
                                    className="bg-purple-50 border border-purple-200 rounded-md p-3 text-purple-900 text-sm w-full"
                                    value={editableEnhancedContent}
                                    onChange={(e) => setEditableEnhancedContent(e.target.value)}
                                    rows={5}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="bg-purple-700 hover:bg-purple-800 text-white" onClick={applyEnhancement}>
                            Apply Enhancement
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

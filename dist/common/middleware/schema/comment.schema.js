import * as z from "zod";
import { ON_Model } from "../../enum/post.enum.js";
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message: "Invalid ObjectId",
});
export const createCommentSchema = z
    .object({
    content: z
        .string()
        .trim()
        .min(1, "Content cannot be empty")
        .max(5000, "Content is too long")
        .optional(),
    attachments: z
        .array(z.url("Attachment must be a valid URL"))
        .max(10, "Maximum 10 attachments allowed")
        .default([])
        .optional(),
    tags: z
        .array(objectIdSchema)
        .max(20, "Maximum 20 tags allowed")
        .refine((tags) => {
        return new Set(tags).size === tags.length;
    }, { error: "Tags Must Be Unique" })
        .optional(),
    postId: objectIdSchema.optional(),
    commentId: objectIdSchema.optional(),
    onModel: z.enum(ON_Model),
})
    .refine((data) => {
    const hasContent = data.content && data.content.trim().length > 0;
    const hasAttachments = data.attachments?.length > 0;
    return hasContent || hasAttachments;
}, {
    message: "Comment must contain content or at least one attachment",
    path: ["content"],
});
export const updateCommentSchema = z
    .object({
    content: z
        .string()
        .trim()
        .min(1, "Content cannot be empty")
        .max(5000, "Content is too long")
        .optional(),
    attachments: z
        .array(z.url("Attachment must be a valid URL"))
        .max(10, "Maximum 10 attachments allowed")
        .optional(),
    removeTags: z.array(objectIdSchema).optional(),
    tags: z.array(objectIdSchema).max(20, "Maximum 20 tags allowed").optional(),
    removeFiles: z.array(z.url()).optional(),
})
    .refine((data) => {
    return !!(data.content ||
        data.attachments ||
        data.tags ||
        data.removeTags ||
        data.removeFiles);
}, {
    message: "You must provide at least one field to update",
    path: ["content"],
});

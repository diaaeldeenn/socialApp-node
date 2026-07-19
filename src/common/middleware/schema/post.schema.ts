import * as z from "zod";
import { CommentAvalability, PostPrivacy } from "../../enum/post.enum.js";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid ObjectId",
});

export const createPostSchema = z
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
      .refine(
        (tags) => {
          return new Set(tags).size === tags.length;
        },
        { error: "Tags Must Be Unique" },
      )
      .optional(),

    allowComments: z.enum(CommentAvalability).optional(),

    postPrivacy: z.enum(PostPrivacy).optional(),
  })
  .refine(
    (data) => {
      const hasContent = data.content && data.content.trim().length > 0;

      const hasAttachments = data.attachments?.length! > 0;

      return hasContent || hasAttachments;
    },
    {
      message: "Post must contain content or at least one attachment",
      path: ["content"],
    },
  );

export type CreatePostI = z.infer<typeof createPostSchema>;










export const updatePostSchema = z
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

      removeFiles:z.array(z.string()).optional(),
      removeTags:z.array(objectIdSchema).optional(),

    tags: z
      .array(objectIdSchema)
      .max(20, "Maximum 20 tags allowed")
      .refine(
        (tags) => {
          return new Set(tags).size === tags.length;
        },
        { error: "Tags Must Be Unique" },
      )
      .optional(),

    allowComments: z.enum(CommentAvalability).optional(),

    postPrivacy: z.enum(PostPrivacy).optional(),
  })

export type UpdatePostI = z.infer<typeof updatePostSchema>;

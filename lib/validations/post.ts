import * as z from 'zod';

export const PostValdiation = z.object({
    content: z.string().nonempty().min(5, {message: 'Minimum 5 characters'}),
    accountId: z.string(),
    image: z.string(),
    prompt: z.string()
})

export const CommentValdiation = z.object({
    comment: z.string().nonempty().min(2, {message: 'Minimum 2 characters'}),
    
})
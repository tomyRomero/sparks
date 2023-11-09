import * as z from 'zod';

export const PostValdiation = z.object({
    content: z.string().nonempty().min(5, {message: 'Minimum 5 characters'}),
    accountId: z.string(),
})

export const CommentValdiation = z.object({
    comment: z.string().nonempty().min(3, {message: 'Minimum 3 characters'}),
    
})
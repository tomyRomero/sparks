import * as z from 'zod';

export const messageValdiation = z.object({
    message: z.string().nonempty().min(1, {message: 'Minimum 1 characters'})
    
})
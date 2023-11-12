"use client"
import { Card, CardHeader, CardTitle, CardDescription , CardContent, CardFooter } from "../ui/card"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { PostValdiation } from "@/lib/validations/post"
import { createPost } from "@/lib/actions/post.actions"
import * as z from "zod";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react"
import Image from "next/image"

interface Props{
    name: string,
    userId: string
}

const getBio = (name: string) => {
    switch (name) {
        case 'movie':
            return "Input a one sentence concept. Sparkify will create an fanastic title! A synopsis that future studios will enjoy! You can even add a movie poster and a cast!"
        case 'Regular':
            return "Create a post"
        default:
            return "No Type Selected"
    }
}

const getTitle = (name:string) => {
    switch(name) {
        case 'movie':
            return "AI Movie Synopsis Generator"
            
        default: 
            return name.toLocaleUpperCase()
    }
}

const AIForm = ({name, userId} : Props) => {

const [loading, setLoading] = useState(false);

const pathname = usePathname();
const router = useRouter();
 const form = useForm<z.infer<typeof PostValdiation>>({
        resolver: zodResolver(PostValdiation),
        defaultValues: {
          content: "",
          accountId: userId,
        },
      });   
    
const onSubmit = async (values: z.infer<typeof PostValdiation>) => {
    setLoading(true);
        await createPost({
          text: values.content,
          author: userId,
          path: pathname,
        });
    
        router.push("/");
      };

  return (
    <div>
      <Card className="border-primary-500 border-2">
          <CardHeader>
            <CardTitle className="mx-auto mb-4 blue_gradient">{getTitle(name)}</CardTitle>
            <CardDescription className="text-black">
              {getBio(name)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
          <Form {...form}>
      <form
        className='mt-4 flex flex-col justify-start gap-10'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-black'>
                Content
              </FormLabel>
              <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1 focus:border-primary-500'>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <CardFooter>
            <Button type='submit' className="mx-auto hover:bg-primary-500">{!loading? <p>Generate Idea</p> : 
            <Image 
            src={"/assets/postloader.svg"}
            alt="loading animation for creating post"
            width = {44}
            height ={34}
            />}
            </Button>
          </CardFooter>
          </form>
            </Form>
          </CardContent>
        </Card>
    </div> 
  )
}

export default AIForm
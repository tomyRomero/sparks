"use client";

import * as z from "zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserValidation } from "@/lib/validations/user";
import { isBase64Image } from "@/lib/utils";
import { updateOrCreateUser } from "@/lib/actions/user.actions";

interface Props {
  user: {
    id: string;
    objectId?: string;
    username?: string;
    name?: string;
    bio?: string;
    image?: string;
  };
  btnTitle: string;
  edit: boolean;
}

const AccountProfile = ({ user, btnTitle , edit}: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [img, setImg] = useState(user.image);
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(()=> {
    const inside = async  () => {
      if(user.image?.startsWith("user"))
    {
      const meter = await getImage(user.image)
      if(meter)
      {
        setDataFetched(true);
      }
    }else{
      setImg(user.image)
      setDataFetched(true);
    }
    }

    inside();
    
  }, [])


  const form = useForm<z.infer<typeof UserValidation>>({
    resolver: zodResolver(UserValidation),
    defaultValues: {
      profile_photo: user?.image ? user.image : "",
      name: user?.name ? user.name : "",
      username: user?.username ? user.username : "",
      bio: user?.bio ? user.bio : "",
    },
  });

  const postImage = async (data: any) => {
    const response = await fetch('/api/S3', {
      method: 'POST',
      body: JSON.stringify(data), // Convert your data to JSON
    });
    
    if (response.ok) {
      // Request was successful, handle the response
      const responseData = await response.json();
      console.log('Server response:', responseData);
      return responseData.filename;
    } else {
      // Request failed, handle the error
      console.error('Error:', response.statusText);
      setLoading(false)
      alert(`There Was An Error Finishing Your Profile, Please Try Again, Error: ${response.statusText}`);
      return false;
    }
  }

  const getImage = async (key: any) => {
   
    const encodedKey = encodeURIComponent(key);
    const getResponse = await fetch(`/api/S3?key=${encodedKey}`, {
      method: 'GET'
    });

    if (getResponse.ok) {
      // Request was successful, handle the response
      const getResponseData = await getResponse.json();
      const match = key.match(/[^.]+$/);
      const result = match ? match[0] : 'jpg';
      console.log("RESULT IMAGE TYPE:", result)
      let base64 = `data:image/${result};base64,` + getResponseData;
      console.log('Success in Getting Image from server! Server response:', base64);
      setImg(base64)
      return true;
    } else {
      // Request failed, handle the error
      console.error('Error:', getResponse.statusText);
      setLoading(false)
      alert(`There Was An Error Finishing Your Profile, Please Try Again, Error: ${getResponse.statusText}`);
      return false;
    }
  }  

  const onSubmit = async (values: z.infer<typeof UserValidation>) => {
    setLoading(true);
    const blob = values.profile_photo;
    const data ={
      image : blob,
      name : `${user.id}_profile_picture`
    }
    try{ 

     if(blob)
      {
        const hasImageChanged = isBase64Image(blob);

       if (hasImageChanged) 
       {
        const imgRes = await postImage(data);
        const imgGetRes = await getImage(imgRes);
        if (imgRes && imgGetRes) {
        values.profile_photo = imgRes;
      }
    }
     } 
    else{
      if(user.image)
      {
        values.profile_photo = user.image;
      }
    }

   const finished = await updateOrCreateUser({
      name: values.name,
      path: pathname,
      username: values.username,
      userId: user.id,
      bio: values.bio,
      image: values.profile_photo,
    });
    
    if(finished)
    {
      setLoading(false);

    if (pathname === "/profile/edit") {
      router.back();
    } else {
      router.push("/");
    }
    }else{
      alert('The Username already exists try again with a different one!')
      setLoading(false);
    }
  
}catch(error)
{
  alert(`There was an Error in OnBroading Your Account, Please try Again: Error: ${error}`)
}
}

  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    e.preventDefault();

    const fileReader = new FileReader();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFiles(Array.from(e.target.files));

      if (!file.type.includes("image")) return;

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        fieldChange(imageDataUrl);
        setImg(imageDataUrl);
      };

      fileReader.readAsDataURL(file);
      
    }
  };


  return (
    <Form {...form}>
      <form
        className='flex flex-col justify-start gap-10'
        onSubmit={form.handleSubmit(onSubmit)}
        encType="multipart/form-data"
      >
        <FormField
          control={form.control}
          name='profile_photo'
          render={({ field }) => (
            <FormItem className='flex items-center gap-2'>
              <FormLabel className='account-form_image-label'>
                {field.value && dataFetched? (
                   <Image
                   //@ts-ignore
                   src={img}
                   alt='profile_icon'
                   width={96}
                   height={96}
                   priority
                   className='rounded-full object-contain'
                 />
                ) : (
                  <Image
                  src='/assets/profile.svg'
                  alt='profile_icon'
                  width={96}
                  height={96}
                  className='object-contain'
                />
                )}
              </FormLabel>
              <FormControl className='flex-1 text-base-semibold text-gray-200'>
                <Input
                  type='file'
                  accept='image/*'
                  placeholder='Add profile photo'
                  className='account-form_image-input'
                  onChange={(e) => handleImage(e, field.onChange)}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className={`text-base-semibold text-light-2 ${edit? 'text-primary-500' : ''}`}>
                Full Name
              </FormLabel>
              <FormControl>
                <Input
                  type='text'
                  className='account-form_input no-focus'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className={`text-base-semibold text-light-2 ${edit? 'text-primary-500' : ''}`}>
                Username
              </FormLabel>
              <FormControl>
                <Input
                  type='text'
                  className='account-form_input no-focus'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='bio'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className={`text-base-semibold text-light-2 ${edit? 'text-primary-500' : ''}`}>
                Biography
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  className='account-form_input no-focus'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

      
       
        <Button type='submit' className={`${loading? "hidden" : ""} bg-black w-28 mx-auto hover:bg-white hover:text-black`}>
          {btnTitle}
        </Button>
       
        <Image
          src={"/assets/spinner.svg"}
          alt={"loader"}
          width={100}
          height={100}
          className={`${loading? "" : "hidden"} mx-auto`}
        />
      </form>
    </Form>
  
  );
};

export default AccountProfile;
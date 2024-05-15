"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { deletePost} from "@/lib/actions/post.actions";
import { toast } from "../ui/use-toast";

interface Props {
  postId: string;
  currentUserId: string;
  authorId: string;
  parentId: any;
  isComment?: boolean;
}

function DeletePost({
  postId,
  currentUserId,
  authorId,
  parentId,
  isComment,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  if (currentUserId !== authorId || pathname === "") return null;

  
const handleDelete = async () => {
  const userConfirmed = window.confirm(`Are you sure you want to delete this ${isComment? 'comment' : 'post'}?`);

  if (userConfirmed) {
    // User clicked "OK" in the confirmation dialog
    // Perform the delete operation
    try{
      await deletePost(postId, pathname, parentId, isComment);
      toast({
        title: "Post Deleted",
      })
        if (!parentId || !isComment) {
          router.push("/")
        }
    }catch(error)
    {
      toast({
        title: "Something went wrong!",
        description: `${error}`, 
        variant: "destructive",
      })
    }
  } else {
    // User clicked "Cancel" in the confirmation dialog
    toast({
      title: "Deletion canceled!",
    })
  }
};


  return (
    <Image
      src='/assets/delete.svg'
      alt='delete'
      width={32}
      height={32}
      className='cursor-pointer object-contain transition-transform duration-300 transform hover:scale-110'
      onClick={handleDelete}
    />
  );
}

export default DeletePost;
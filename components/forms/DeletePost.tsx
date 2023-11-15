"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { deletePost} from "@/lib/actions/post.actions";

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
        if (!parentId || !isComment) {
          router.push("/")
        }
    }catch(error)
    {
      alert("Error Deleting Content, Please Try Again Later")
    }
  } else {
    // User clicked "Cancel" in the confirmation dialog
    alert("Deletion canceled.");
  }
};


  return (
    <Image
      src='/assets/delete.svg'
      alt='delete'
      width={24}
      height={24}
      className='cursor-pointer object-contain'
      onClick={handleDelete}
    />
  );
}

export default DeletePost;
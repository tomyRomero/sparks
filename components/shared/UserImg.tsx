"use client"

import { useEffect, useState } from "react";
import Image from "next/image"
import { getImageData } from "@/lib/s3";

const Userimg = ({styles , user}: any) => {

    const [img, setImg] = useState('/assets/profile.svg');
    
    useEffect( () => {
      const load = async () => {
        try{
          const res = await getImageData(user.image);
          if(res)
          {
            setImg(res);
          }
        }catch(error)
        {
          console.log("Error" , error)
        }
      }

      load();

    }, [])

    console.log("UserImg User:", user)
    console.log("styles:" , styles)

  return (
    <div>
    <Image 
    src={`${img}`}
    alt="User Image"
    width={100}
    height={100}
    className={`${styles}`}
    />
    </div>

  )
}

export default Userimg
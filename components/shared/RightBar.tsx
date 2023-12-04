"use client"
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

function RightBar()
{
    const pathname = usePathname();

    const isActive = () => {
        return pathname.includes("/chat")
    }

    return(
        <section className={`custom-scrollbar rightsidebar ${isActive()? 'hidden': ''}`}>
            <div className="flex flex-1 flex-col justify-start w-52">
                

                <Link
                href={"/chat"}
                >
                <div className="flex gap-4 mx-auto">
                    <h3 className="text-heading4-medium text-light-1 cursor-pointer">Recent Chats..</h3>
                    <Image 
                        src={"/assets/message.svg"}
                        alt="Message Picture"
                        width={28}
                        height={28}
                        className="justify-end"
                    />
                </div>
                </Link>
                <div className="w-48 mx-auto m-1 p-1 border-b-2 border-white" />
                <h3 className="text-left mt-2 text-light-1">No Chats...</h3>
            </div>
            
        </section>
    )
}

export default RightBar;
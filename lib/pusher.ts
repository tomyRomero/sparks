import Pusher from "pusher-js";

//@ts-ignore
const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
    cluster: "us2",
  });

  export default pusherClient;
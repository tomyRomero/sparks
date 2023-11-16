import OpenAI from "openai";

const openai = new OpenAI();

async function movie(outline: string) {
  const completion = await openai.chat.completions.create({
    messages: [{"role": "system", "content": "You are a helpful assistant that generates ideas based on a sentence prompt."},
        {"role": "user", "content": "Generate an engaging, professional and marketable movie synopsis based on an outline. The synopsis should have an Title in the beginning, include actors names in brackets after each character. Choose actors that would be ideal for this role. Here is an example prompt Outline: A big-headed daredevil fighter pilot goes back to school only to be sent on a deadly mission."},
        {"role": "assistant", "content": "Title: Naval Fighter - The Journey Begins synopsis: The Top Gun Naval Fighter Weapons School is where the best of the best train to refine their elite flying skills. When hotshot fighter pilot Maverick (Tom Cruise) is sent to the school, his reckless attitude and cocky demeanor put him at odds with the other pilots, especially the cool and collected Iceman (Val Kilmer). But Maverick isn't only competing to be the top fighter pilot, he's also fighting for the attention of his beautiful flight instructor, Charlotte Blackwood (Kelly McGillis). Maverick gradually earns the respect of his instructors and peers - and also the love of Charlotte, but struggles to balance his personal and professional life. As the pilots prepare for a mission against a foreign enemy, Maverick must confront his own demons and overcome the tragedies rooted deep in his past to become the best fighter pilot and return from the mission triumphant."},
        {"role": "user", "content": outline}],
    model: "gpt-3.5-turbo",
  });

  console.log("Response from Movie Open AI")
  console.log(completion.choices[0])

  
  const content = completion.choices[0].message.content
  console.log("Content: ", content)
  return(content);
}


export const GET = async (req: any, res: any) => { 
    try{
      const type = req.nextUrl.searchParams.get("type")
      const prompt = req.nextUrl.searchParams.get("prompt");
      let bodyContents = null;
      switch (type){
        case "movie":
           bodyContents = await movie(prompt)
           break;
        default:
           bodyContents = null
           break;
      }

      if(bodyContents)
      {
      return new Response(JSON.stringify(bodyContents), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      }else{
        return new Response(`No Type Found For Get Request, Type: ${type}, Is Not Valid`, { status: 500 })
      }
    }catch(error)
    {
        console.log("Erorr in Get API for OpenAI:", error)
        return new Response(`Error in GET endpoint: ${error}`, { status: 500 })
    }
}

export const POST = async (req: any, res: any) => {

}


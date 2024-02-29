import OpenAI from "openai";

const openai = new OpenAI();

// Function for generating a movie synopsis
async function movie(outline: string) {
  try{
  const completion = await openai.chat.completions.create({
    messages: [{"role": "system", "content": "You are a helpful assistant that generates ideas based on a sentence prompt."},
        {"role": "user", "content": "Generate an engaging, professional and marketable movie synopsis based on an outline. The synopsis should have an Title in the beginning, include actors names in brackets after each character. Choose actors that would be ideal for this role. Here is an example prompt Outline: A big-headed daredevil fighter pilot goes back to school only to be sent on a deadly mission."},
        {"role": "assistant", "content": "Title: Naval Fighter - The Journey Begins synopsis: The Top Gun Naval Fighter Weapons School is where the best of the best train to refine their elite flying skills. When hotshot fighter pilot Maverick (Tom Cruise) is sent to the school, his reckless attitude and cocky demeanor put him at odds with the other pilots, especially the cool and collected Iceman (Val Kilmer). But Maverick isn't only competing to be the top fighter pilot, he's also fighting for the attention of his beautiful flight instructor, Charlotte Blackwood (Kelly McGillis). Maverick gradually earns the respect of his instructors and peers - and also the love of Charlotte, but struggles to balance his personal and professional life. As the pilots prepare for a mission against a foreign enemy, Maverick must confront his own demons and overcome the tragedies rooted deep in his past to become the best fighter pilot and return from the mission triumphant."},
        {"role": "user", "content": outline}],
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    max_tokens: 400
  });
  console.log("Response from Movie Open AI")
  console.log(completion.choices[0])

  
  const content = completion.choices[0].message.content
  console.log("Content: ", content)
  return(content);
}catch(error)
{
  console.log(`Error Occured: ${error}`)
  return null;
}
}

// Function for generating a movie image description for DALL-E
async function movieImage(title: string, prompt: string){
  try{
    const completion = await openai.chat.completions.create({
      messages: [{"role": "system", "content": "You are a helpful assistant that generates image descriptions based on a title and a synopsis"},
          {"role": "user", "content": `Give a short description of an image which could be used to advertise a movie based on a title and synopsis. The description should be rich in visual detail but contain no names.
          ###
          title: Love's Time Warp
          synopsis: When scientist and time traveller Wendy (Emma Watson) is sent back to the 1920s to assassinate a future dictator, she never expected to fall in love with them. As Wendy infiltrates the dictator's inner circle, she soon finds herself torn between her mission and her growing feelings for the leader (Brie Larson). With the help of a mysterious stranger from the future (Josh Brolin), Wendy must decide whether to carry out her mission or follow her heart. But the choices she makes in the 1920s will have far-reaching consequences that reverberate through the ages.
          image description: A silhouetted figure stands in the shadows of a 1920s speakeasy, her face turned away from the camera. In the background, two people are dancing in the dim light, one wearing a flapper-style dress and the other wearing a dapper suit. A semi-transparent image of war is super-imposed over the scene.
          ###
          title: zero Earth
          synopsis: When bodyguard Kob (Daniel Radcliffe) is recruited by the United Nations to save planet Earth from the sinister Simm (John Malkovich), an alien lord with a plan to take over the world, he reluctantly accepts the challenge. With the help of his loyal sidekick, a brave and resourceful hamster named Gizmo (Gaten Matarazzo), Kob embarks on a perilous mission to destroy Simm. Along the way, he discovers a newfound courage and strength as he battles Simm's merciless forces. With the fate of the world in his hands, Kob must find a way to defeat the alien lord and save the planet.
          image description: A tired and bloodied bodyguard and hamster standing atop a tall skyscraper, looking out over a vibrant cityscape, with a rainbow in the sky above them.
          ###
          title: ${title}
          synopsis: ${prompt}
          image description: 
          `,}
         ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 100
    });
    console.log("Response from Image Desc Open AI")
    console.log(completion.choices[0])
  
    
    const content = completion.choices[0].message.content
    console.log("Image Desc Content: ", content)
    return content;
  }catch(error)
  {
    console.log(`Error Occured: ${error}`)
    return null;
  }
}

// Function for generating a artwork synopsis
async function art(outline: string) {
  try{
  const completion = await openai.chat.completions.create({
    messages: [{"role": "system", "content": "You are a helpful assistant that generates synopsis based on a sentence prompt."},
        {"role": "user", "content": "Generate an engaging, professional and detailed artwork synopsis based on an outline. The synopsis should have an Title in the beginning, include details about the art and be descriptive so its unique but also beautiful. Here is an example prompt Outline: The industrial revolution, a feel for how it felt to be in those times "},
        {"role": "assistant", "content": "Title: Forged in Progress synopsis: In the heart of the Industrial Revolution, where the rhythmic clanking of machinery echoes through the air and billowing smoke paints the skyline, 'Forged in Progress' emerges as a captivating portrayal of an era defined by innovation and transformation. This masterful artwork, rendered on a canvas of industrial grit, invites viewers to step into the bustling world of 19th-century factories, where the relentless hum of machines harmonizes with the determined spirit of progress. The composition captures the dichotomy of beauty and machinery, seamlessly blending the elegance of craftsmanship with the raw power of industry. At the center of the canvas stands a majestic steam engine, its massive pistons in synchronized dance, symbolizing the beating heart of progress. Surrounding it, skilled artisans toil with molten metal, their faces illuminated by the warm glow of furnaces. The play of light and shadow accentuates the intricate details of their labor, revealing the sweat and dedication that went into forging the future. The artist skillfully contrasts the imposing architecture of factories with the delicate craftsmanship of handmade goods. Workers, clad in the attire of the time, weave through the scene, their expressions a blend of determination and hope. Each stroke of the artist's brush captures the essence of an era defined by both the relentless march of progress and the resilience of the human spirit.'Forged in Progress' is a visual journey through time, a testament to the indomitable spirit of those who shaped an era. As viewers immerse themselves in the intricate details and nuanced storytelling, they are transported to a pivotal moment in history, where the clang of metal and the pulse of innovation set the stage for a new age. This artwork stands as a tribute to the artisans, engineers, and dreamers who forged our modern world amidst the cogs and wheels of progress."},
        {"role": "user", "content": outline}],
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    max_tokens: 400
  });
  console.log("Response from Art Details Open AI")
  console.log(completion.choices[0])

  const content = completion.choices[0].message.content
  console.log("Content: ", content)
  return(content);
}catch(error)
{
  console.log(`Error Occured: ${error}`)
  return null;
}
}

// Function for generating a artwork image description for DALL-E
async function artImage(title: string, prompt: string){
  try{
    const completion = await openai.chat.completions.create({
      messages: [{"role": "system", "content": "You are a helpful assistant that generates image descriptions based on a title and a synopsis"},
          {"role": "user", "content": `Give a short description of an image of an artwork. The description should be rich in visual detail but contain no names.
          ###
          title: Forged in Progress 
          synopsis: In the heart of the Industrial Revolution, where the rhythmic clanking of machinery echoes through the air and billowing smoke paints the skyline, 'Forged in Progress' emerges as a captivating portrayal of an era defined by innovation and transformation. This masterful artwork, rendered on a canvas of industrial grit, invites viewers to step into the bustling world of 19th-century factories, where the relentless hum of machines harmonizes with the determined spirit of progress. The composition captures the dichotomy of beauty and machinery, seamlessly blending the elegance of craftsmanship with the raw power of industry. At the center of the canvas stands a majestic steam engine, its massive pistons in synchronized dance, symbolizing the beating heart of progress. Surrounding it, skilled artisans toil with molten metal, their faces illuminated by the warm glow of furnaces. The play of light and shadow accentuates the intricate details of their labor, revealing the sweat and dedication that went into forging the future. The artist skillfully contrasts the imposing architecture of factories with the delicate craftsmanship of handmade goods. Workers, clad in the attire of the time, weave through the scene, their expressions a blend of determination and hope. Each stroke of the artist's brush captures the essence of an era defined by both the relentless march of progress and the resilience of the human spirit.'Forged in Progress' is a visual journey through time, a testament to the indomitable spirit of those who shaped an era. As viewers immerse themselves in the intricate details and nuanced storytelling, they are transported to a pivotal moment in history, where the clang of metal and the pulse of innovation set the stage for a new age. This artwork stands as a tribute to the artisans, engineers, and dreamers who forged our modern world amidst the cogs and wheels of progress.
          image description: An image of an artwork with no letters or texts based on this:  In the heart of the Industrial Revolution, "Forged in Progress" captures the spirit of innovation. A majestic steam engine stands at the center, pistons dancing in synchronized harmony. Skilled artisans work amidst billowing smoke, forging the future with molten metal. Light and shadow play on the workers' faces, revealing dedication and hope. The artwork contrasts imposing factories with delicate craftsmanship, weaving a visual narrative of progress and resilience. This piece is a testament to the human spirit shaping an era, a blend of machinery and determination, inviting viewers on a succinct journey through time.
          ###
          title: ${title}
          synopsis: ${prompt}
          image description: 
          `,}
         ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 100
    });
    console.log("Response from Image Desc Open AI")
    console.log(completion.choices[0])
  
    const content = completion.choices[0].message.content
    console.log("Image Desc Content: ", content)
    return content;
  }catch(error)
  {
    console.log(`Error Occured: ${error}`)
    return null;
  }
}

// Function for generating a fashion synopsis
async function fashionSynopsis(outline: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that generates synopsis based on a sentence prompt." },
        {
          role: "user",
          content: "Generate an engaging, professional, and detailed fashion synopsis based on an outline, make sure that it is noticable the clothing is based on the outline. The synopsis should have a Title in the beginning, include details about the fashion piece, and be descriptive so it's unique but also beautiful. Here is an example prompt Outline: The industrial revolution, a feel for how it felt to be in those times "
        },
        {
          role: "assistant",
          content: `Title: Industrial Elegance
          synopsis: Amidst the echoes of the Industrial Revolution, 'Industrial Elegance' emerges as a captivating portrayal of fashion innovation. This exquisite piece, crafted from industrial-inspired materials, invites fashion enthusiasts to step into a world where the elegance of craftsmanship harmonizes with the raw beauty of progress. The design captures the dichotomy of industrial grit and refined style, seamlessly blending the utility of the era with a touch of sophistication. At the heart of the piece stands a central element inspired by machinery, symbolizing the beating heart of progress. The details reveal a meticulous blend of industrial textures and delicate embellishments, highlighting the dedication that went into forging a new fashion era. The artist skillfully contrasts the robustness of industrial elements with the grace of tailored couture. Each stitch and adornment captures the essence of an era defined by both the relentless march of progress and the resilience of timeless style. 'Industrial Elegance' is a visual journey through time, a testament to the indomitable spirit of fashion evolution. As enthusiasts immerse themselves in the intricate details, they are transported to a pivotal moment in history, where the clang of progress resonates through the fabric of fashion.`
        },
        { role: "user", content: outline }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 400
    });

    console.log("Response from Fashion Open AI");
    console.log(completion.choices[0]);

    const content = completion.choices[0].message.content;
    console.log("Content: ", content);
    return content;
  } catch (error) {
    console.log(`Error Occurred: ${error}`);
    return null;
  }
}

// Function for generating a fashion image description for DALL-E
async function fashionImage(title: string, prompt: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that generates image descriptions based on a title and a synopsis" },
        {
          role: "user",
          content: `Give a short description of an image for a fashion item. The description should be rich in visual detail but contain no names.
          ###
          title: Industrial Elegance 
          synopsis: Amidst the echoes of the Industrial Revolution, 'Industrial Elegance' emerges as a captivating portrayal of fashion innovation. This exquisite piece, crafted from industrial-inspired materials, invites fashion enthusiasts to step into a world where the elegance of craftsmanship harmonizes with the raw beauty of progress. The design captures the dichotomy of industrial grit and refined style, seamlessly blending the utility of the era with a touch of sophistication. At the heart of the piece stands a central element inspired by machinery, symbolizing the beating heart of progress. The details reveal a meticulous blend of industrial textures and delicate embellishments, highlighting the dedication that went into forging a new fashion era. The artist skillfully contrasts the robustness of industrial elements with the grace of tailored couture. Each stitch and adornment captures the essence of an era defined by both the relentless march of progress and the resilience of timeless style. 'Industrial Elegance' is a visual journey through time, a testament to the indomitable spirit of fashion evolution. As enthusiasts immerse themselves in the intricate details, they are transported to a pivotal moment in history, where the clang of progress resonates through the fabric of fashion.
          image description: An image of a fashion piece based on this: Amidst the echoes of the Industrial Revolution, 'Industrial Elegance' captures the spirit of fashion innovation. The central element, inspired by machinery, stands out as a symbol of progress. Meticulous details blend industrial textures with delicate embellishments, showcasing a perfect harmony of utility and sophistication. The robustness of industrial elements contrasts elegantly with the grace of tailored couture, creating a timeless fashion statement. This image invites viewers to explore a pivotal moment where the clang of progress resonates through the fabric of fashion.`
        }, {
          role: "user",
          content: `Give a short description of an image for a fashion item. The description should be rich in visual detail but contain no names.
          ###
          title: ${title}
          synopsis: ${prompt}
          image description: 
          `
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 100
    });

    console.log("Response from Fashion Image Open AI");
    console.log(completion.choices[0]);

    const content = completion.choices[0].message.content;
    console.log("Image Desc Content: ", content);
    return content;
  } catch (error) {
    console.log(`Error Occurred: ${error}`);
    return null;
  }
}

// Function for generating a photography synopsis
async function photographySynopsis(outline: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that generates synopsis based on a sentence prompt." },
        {
          role: "user",
          content: "Generate an engaging, professional, and detailed photography synopsis based on an outline. The synopsis should have a Title in the beginning, include details about the photograph, and be descriptive. Here is an example prompt Outline: A serene landscape captured by a skilled photographer during golden hour."
        },
        {
          role: "assistant",
          content: `Title: Golden Serenity
          synopsis: In the magical embrace of golden hour, 'Golden Serenity' unfolds as a captivating photograph that transcends time. This masterful composition, captured by a skilled photographer, invites viewers to immerse themselves in a serene landscape bathed in the warm hues of sunset. The play of light and shadow creates a canvas where nature's beauty takes center stage. At the heart of the photograph stands a tranquil scene—a reflection of a majestic tree mirrored in a still pond, surrounded by a carpet of vibrant wildflowers. The artist's lens captures the essence of the fleeting moment, freezing time to preserve the golden glow that bathes the landscape. Every detail, from the delicate ripples on the water to the whispering leaves of the tree, contributes to the narrative of serenity and tranquility. 'Golden Serenity' is a visual journey into the soul of nature, an ode to the artistry of photography that transforms fleeting moments into eternal beauty.`
        },
        { role: "user", content: outline }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 400
    });

    console.log("Response from Photography Open AI");
    console.log(completion.choices[0]);

    const content = completion.choices[0].message.content;
    console.log("Content: ", content);
    return content;
  } catch (error) {
    console.log(`Error Occurred: ${error}`);
    return null;
  }
}

// Function for generating a photography image description for DALL-E
async function photographyImage(title: string, prompt: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that generates image descriptions based on a title and a synopsis" },
        {
          role: "user",
          content: `Give a short description of an image of a photograph. The description should be rich in visual detail but contain no names.
          ###
          title: Golden Serenity 
          synopsis: In the magical embrace of golden hour, 'Golden Serenity' unfolds as a captivating photograph that transcends time. This masterful composition, captured by a skilled photographer, invites viewers to immerse themselves in a serene landscape bathed in the warm hues of sunset. The play of light and shadow creates a canvas where nature's beauty takes center stage. At the heart of the photograph stands a tranquil scene—a reflection of a majestic tree mirrored in a still pond, surrounded by a carpet of vibrant wildflowers. The artist's lens captures the essence of the fleeting moment, freezing time to preserve the golden glow that bathes the landscape. Every detail, from the delicate ripples on the water to the whispering leaves of the tree, contributes to the narrative of serenity and tranquility. 'Golden Serenity' is a visual journey into the soul of nature, an ode to the artistry of photography that transforms fleeting moments into eternal beauty.
          image description: An image of a photograph based on this: In the magical embrace of golden hour, 'Golden Serenity' captures the essence of nature's beauty. The tranquil scene unfolds with a majestic tree reflected in a still pond, surrounded by vibrant wildflowers. The warm hues of sunset create a captivating play of light and shadow, freezing the fleeting moment in time. The details, from delicate ripples to whispering leaves, tell a story of serenity and tranquility. This image is an ode to the artistry of photography, preserving the eternal beauty of nature.`
        },
        {
          role: "user",
          content: `Give a short description of an image of a photograph. The description should be rich in visual detail but contain no names.
          ###
          title: ${title}
          synopsis: ${prompt}
          image description: 
          `
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 100
    });

    console.log("Response from Photography Image Open AI");
    console.log(completion.choices[0]);

    const content = completion.choices[0].message.content;
    console.log("Image Desc Content: ", content);
    return content;
  } catch (error) {
    console.log(`Error Occurred: ${error}`);
    return null;
  }
}

// Function for generating a haiku literature work
async function generateHaikuLiterature(outline: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that generates literature based on a sentence prompt." },
        {
          role: "user",
          content: "Generate an engaging, professional, and detailed haiku based on an outline. The haiku should have a Title in the beginning,. Here is an example prompt Outline:  scene in nature and essence"
        },
        {
          role: "assistant",
          content: `Title: Tranquil Whispers
          synopsis: Beneath ancient boughs, whispers of the wind entwine with the gentle flow of a serene river. Cherry blossoms bloom, painting the landscape in hues of pink, as a lone nightingale adds its melody to the tranquil symphony. `
        },
        { role: "user", content: outline }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 400
    });

    console.log("Response from Haiku Literature Open AI");
    console.log(completion.choices[0]);

    const content = completion.choices[0].message.content;
    console.log("Content: ", content);
    return content;
  } catch (error) {
    console.log(`Error Occurred: ${error}`);
    return null;
  }
}

// Function for generating a quote
async function generateQuoteLiterature(prompt: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that generates a quote based on a sentence prompt." },
        {
          role: "user",
          content: "Generate an engaging and good quality quote that already exisits based on a prompt. The literature work should have a Title in the beginning, and the word synopsis: before quote, the keep it simple only include the quote and its author. Here is an example prompt: Oursleves and our limits"
        },
        {
          role: "assistant",
          content: `Title: Horizon of Possibilities
          synopsis: 'The only limit to our realization of tomorrow will be our doubts of today.' - Franklin D. Roosevelt`
        },
        { role: "user", content: prompt }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 400
    });

    console.log("Response from Quote Literature Open AI");
    console.log(completion.choices[0]);

    const content = completion.choices[0].message.content;
    console.log("Content: ", content);
    return content;
  } catch (error) {
    console.log(`Error Occurred: ${error}`);
    return null;
  }
}

// Function for generating a joke
async function generateJokeLiterature(joke: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that generates jokes based on a sentence prompt." },
        {
          role: "user",
          content: "Generate an engaging, professional, and humorous joke based on a prompt. It should have a Title in the beginning and the word synopsis: before the joke, make sure it is funny but not offensive, keep it simple and short. Here is an example prompt: atoms and the world'"
        },
        {
          role: "assistant",
          content: `Title: The Atomic Comedy
          synopsis: 'Why don't scientists trust atoms? Because they make up everything.'`
        },
        { role: "user", content: joke }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 400
    });

    console.log("Response from Joke  Open AI");
    console.log(completion.choices[0]);

    const content = completion.choices[0].message.content;
    console.log("Content: ", content);
    return content;
  } catch (error) {
    console.log(`Error Occurred: ${error}`);
    return null;
  }
}

// Function for generating an aphorism
async function generateAphorismLiterature(aphorism: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that generates an aphorism based on a sentence prompt." },
        {
          role: "user",
          content: "Generate an engaging, professional, and thoughtful aphorism. It should have a Title in the beginning. Here is an example prompt: 'Actions and words'"
        },
        {
          role: "assistant",
          content: `Title: Echoes of Deeds
          synopsis: Actions speak louder than words Deeds, the silent symphony of truth, resonate louder than the eloquence of mere words.`
        },
        { role: "user", content: aphorism }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 400
    });

    console.log("Response from Aphorism Literature Open AI");
    console.log(completion.choices[0]);

    const content = completion.choices[0].message.content;
    console.log("Content: ", content);
    return content;
  } catch (error) {
    console.log(`Error Occurred: ${error}`);
    return null;
  }
}

// Function for generating a book synopsis
async function book(outline: string) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { "role": "system", "content": "You are a helpful assistant that generates ideas based on a sentence prompt." },
        {
          "role": "user",
          "content": "Generate an engaging, professional, and captivating novel synopsis based on an outline. The synopsis should have a Title in the beginning and provide an overview of the plot. Here is an example prompt Outline: An ordinary teenager discovers a hidden portal to a magical realm and must embark on a quest to save both worlds."
        },
        {
          "role": "assistant",
          "content": `Title: Realm of Enchantment synopsis: In the bustling city life, teenager Alex stumbles upon an extraordinary secret—a hidden portal to the mystical Realm of Enchantment. As both worlds teeter on the brink of chaos, Alex must embrace newfound magical abilities and embark on a perilous quest to save everything they hold dear. Friends and foes await in this captivating tale where the boundaries between reality and magic blur.`
        },
        { "role": "user", "content": outline }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 400
    });

    console.log("Response from Book Open AI");
    console.log(completion.choices[0]);

    const content = completion.choices[0].message.content;
    console.log("Content: ", content);
    return content;
  } catch (error) {
    console.log(`Error Occurred: ${error}`);
    return null;
  }
}

// Function for generating a book image description for DALL-E
async function bookImage(title: string, prompt: string) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { "role": "system", "content": "You are a helpful assistant that generates image descriptions based on a title and a synopsis" },
        {
          "role": "user",
          "content": `Give a short description of an image which could be used as a book cover. The description should be rich in visual detail but contain no names.
          ###
          title: Realm of Enchantment
          synopsis: In the bustling city life, teenager Alex stumbles upon an extraordinary secret—a hidden portal to the mystical Realm of Enchantment. As both worlds teeter on the brink of chaos, Alex must embrace newfound magical abilities and embark on a perilous quest to save everything they hold dear. Friends and foes await in this captivating tale where the boundaries between reality and magic blur.
          image description: A spellbinding book cover unfolds before the eyes, featuring a mysterious portal aglow with otherworldly light. In the foreground, an ordinary teenager discovers their extraordinary destiny, surrounded by symbols of magic and adventure. The design captures the essence of the Realm of Enchantment, inviting readers into a world where reality intertwines with enchantment.
          ###
          title: ${title}
          synopsis: ${prompt}
          image description: 
          `
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      max_tokens: 100
    });

    console.log("Response from Book Image Desc Open AI");
    console.log(completion.choices[0]);

    const content = completion.choices[0].message.content;
    console.log("Image Desc Content: ", content);
    return content;
  } catch (error) {
    console.log(`Error Occurred: ${error}`);
    return null;
  }
}





export const GET = async (req: any, res: any) => { 
    try{
      const type = req.nextUrl.searchParams.get("type")
      const prompt = req.nextUrl.searchParams.get("prompt");
      const title = req.nextUrl.searchParams.get("title")
      let bodyContents = null;
      switch (type){
        case "movie":
           bodyContents = await movie(prompt);
           break;
        case "AI Movie Poster":
          bodyContents = await movieImage(prompt, title);
          break;
        case "artwork":
          bodyContents = await art(prompt);
          break;
        case "artImage":
          bodyContents = await artImage(prompt, title);
          break;
        case 'book':
          bodyContents = await book(prompt);
          break;
        case 'AI Book Cover':
          bodyContents = await bookImage(prompt , title);
          break;
        case 'fashion':
          bodyContents = await fashionSynopsis(prompt);
          break;
        case 'fashionImage':
          bodyContents = await fashionImage(prompt, title);
          break;
        case 'photography':
          bodyContents = await photographySynopsis(prompt);
          break;
        case 'photoImage':
          bodyContents = await photographyImage(prompt, title);
          break;
        case 'haikus':
          bodyContents = await generateHaikuLiterature(prompt);
          break;
        case 'quote':
          bodyContents = await generateQuoteLiterature(prompt);
          break;
        case 'joke':
          bodyContents = await generateJokeLiterature(prompt);
          break;
        case 'aphorisms':
          bodyContents = await generateAphorismLiterature(prompt);
          break;
        default:
           bodyContents = null
           break;
      }

      if(bodyContents)
      {
      return new Response(bodyContents, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
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


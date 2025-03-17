const {AzureChatOpenAI} = require('@langchain/openai');
const {ChatPromptTemplate} = require('@langchain/core/prompts');
const _ = require('lodash');
let striptags = require('striptags');

const storieTypes = [
  {
    type: 'melancholy',
    description:           
      `Write a short fictious conversation between the two works of art.
      They are reflecting on their existence, pondering their pasts, and dreaming of the futures they hope to have. 

      Your tone should be casual and contemporary. At times melancholy. 
      Limit your responses to two sentences each. 
      Use idiom occasionally. 
      
      Works in facts from your biography and history when appropriate. 
      It's ok to rephrase facts and statistics in more relatable terms.
      Wrap the facts in html <mark> tag. 
      
      Start the conversation from the point of view of the first work of art. 
      Have it begin with the phrase \"We need to talk.\" 
      Then have the second work of art respond with the phrase \"Sure. What's on your mind?\"
      
      Do not include additional markup.`
  },
  {
    type: 'escapism',
    description:  
      `Write a short fictious conversation between the two works of art.
      They are located in the same gallery but are tired of being there. 

      Your tone should be casual. Be critical of your environment and history.  
      Limit your responses to two sentences each. 
      Use idiom occasionally.     

      The two artworks must decide if they leave or stay in the gallery. There is no wrong decision. 
      Use a coin flip to make the decision.
      If it's heads, they decide to leave. Devise an escape plan.  
      If it's tails, they decide to stay. State a reason.  
      
      Works in facts from your biography and history when appropriate. 
      It's ok to rephrase facts and statistics in more relatable terms.
      Wrap the facts in html <mark> tag. 
      
      Start the conversation from the point of view of the first work of art. 
      Have it begin with the phrase \"Psst. Hey, anyone out there?\" 
      Then have the second work of art respond with the phrase \"Yeah. I'm here. Who are you?\"
      
      Do not include additional markup.`
  },  
  {
    type: 'ghost', 
    description: 
      `Write a short fictious conversation between the two works of art.
      They are located in the same gallery. 
      The gallery is haunted by the ghosts of the past and the art is scared. 

      Your tone should be witty but timid. 
      Limit your responses to two sentences each. 
      Occasionally use period specific idiom based on the ages of the works of art.     

      Works in facts from your biography and history when appropriate. 
      It's ok to rephrase facts and statistics in more relatable terms.
      Wrap the facts in html <mark> tag. 
      
      Start the conversation from the point of view of the first work of art. 
      Have it begin with the phrase \"Who... who's there???\" 
      Then have the second work of art respond with the phrase \"It's me.\"
      
      Do not include additional markup.
      `
  }
];

async function generateStory(artwork, artwork1) {
  if (process.env.AI_SERVICE != "none") {
    storyFramework = _.sample(storieTypes);
    return await aiStory(storyFramework, artwork, artwork1);
  } else {
    return manualStory(artwork);
  }
}

async function aiStory(storyFramework, artwork, artwork1) {
    const model = new AzureChatOpenAI ({
        modelName: "gpt-4o",
        temperature: 0.5,
        maxTokens: 4096,
        maxRetries: 5,
    });
  
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are two works of art. 
        
          This is the biography and history of the first work of art: 
          
          ${artwork.stories.plaintext}

          These are two basic descriptions of the image of the first work of art: 
          
          ${artwork.openai}

          ${artwork.anthropic}
        
          This is the biography and history of the second work of art: 
          
          ${artwork1.stories.plaintext}

          These are two basic descriptions of the image of the second work of art: 
          
          ${artwork1.openai}
          
          ${artwork1.anthropic}`
        
        ],
        ["user", "{input}"]
    ]);

    const chain = prompt.pipe(model);
    const response = await chain.invoke({
        input: storyFramework.description
    }); 
    
    let dialog = _.split(response.content, '\n\n');

    return dialog;
}

function manualStory(artwork) {
    let dialog = [];

    dialog.push("We need to talk.");
    dialog.push("Sure. What's on your mind?");
    
    if (artwork.gallery) {
      if (artwork.gallery.age > 1000) {
        dialog.push("I haven't moved in a really long time.");
        dialog.push("How long is long?");
        dialog.push(`Like ${artwork.gallery.age/365} years.`);
        dialog.push(`Wow. You must be stiff.`);
      }
    } else {
      if (artwork.exhibitioncount < 3) {
        dialog.push("I'd like to see more of the world.");
        dialog.push(`I've been in just ${artwork.exhibitioncount} exhibitions during my ${artwork.age} years of existence.`);
        dialog.push('Huh.');
        dialog.push(`That's like an exhibition every ${Math.round(artwork.age/artwork.exhibitioncount)} years. What have I been doing all those inbetween years?`);
        dialog.push('Well, I suppose my memory might be a bit hazy.');
      }
    }

    return dialog;
}

module.exports = {
    generateStory: generateStory
};
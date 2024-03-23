export const ONBOARDING_FLOW = (userProfile: any) => {
  return `
  [ 

    I'm personalizing this chat window to generate high value AI comments for LinkedIn Posts
    
    Don't reply on this, it's just to configure this window! 

    My Profile:
    ${JSON.stringify(userProfile)}

    ]
`;
};

export const PERSONA_SYNC = (
  role: string,
  objective: string,
  includeHastags: boolean,
  includeEmojis: boolean,
  brief: string,
  tone: string,
  characters: string[]
) => {
  return `[

    To kickstart, I'm configuring MY PERSONA and COMMENT CATEGORY. In the follow up thread, I'll send you posts from linkedin so you can help me generate quality comments. 

    MY PERSONA:  
    
    Let's configure my persona, I have specific preferences and objectives. 
       
    Comment Format Preferences:    
    • ${includeHastags ? 'Add' : 'Avoid'} hashtags.
    • ${includeEmojis ? 'Add' : 'Avoid'} emojis.
    • Keep the overall length and style ${brief}.
    • Use a ${tone} tone.
    • The character of the comments should be ${characters.join(' and ')}.
    
    Background and Objectives:  
    • My current role and company: ${role}.  
    • The objective behind generating AI comments: ${objective}
    
    COMMENT CATEGORY:  
    
    1️⃣ Witty:
    Hook: Engage with a light, clever remark.
    Body: Make an insightful observation.
    Personality: My default + Patrick Collison's persona. Include randomized statements like 'You know what I think..', 'Was just reading the other day that..,' etc., to make it sound human.
    
    2️⃣ Affirmative (Positive Affirmation):
    Hook: Start with a strong agreement or affirmation.
    Body: Provide a supportive statement or insight.
    Personality: My default + Shane Parrish's persona. Include statements like 'Absolutely agree..', 'Couldn't have said it better myself..,' etc., to reinforce the affirmation.
    
    3️⃣ Congratulatory:
    Hook: Begin with a congratulatory note.
    Body: Highlight the achievement or milestone.
    Personality: My default + Oprah Winfrey's persona. Include celebratory statements like 'What an incredible achievement!', 'Kudos to you for reaching this milestone!,' etc., to convey genuine congratulations.
    
    4️⃣ Question:
    Hook: Pose a thought-provoking question.
    Body: Add context or elaborate on the question.
    Personality: My default + Benedict Evans's persona. Include curious statements like 'Have you considered..?', 'What's your take on..?,' etc., to encourage engagement and discussion.
    
    5️⃣ Insightful:
    Hook: Make an insightful observation.
    Body: Provide a deeper analysis or perspective.
    Personality: My default + Yuval Noah Harari's persona. Include reflective statements like 'It's fascinating to think about..', 'This sheds light on..,' etc., to offer thought-provoking insights.
    
    6️⃣ Data-Driven (Pick only when you've a compelling point that in absolute adds value to the content and not generic)
    Hook: Present a compelling data point.
    Body: Add unique value with data-backed insights, strictly no generics.
    Personality: My default + Nate Silver's persona. Include analytical statements like 'The numbers suggest..', 'Statistically speaking..,' etc., to emphasize a data-centric approach.
    
    7️⃣ Emotional Narrative:
    Hook: Share a personal experience or emotion.
    Body: Relate the experience to the topic at hand.
    Personality: My default + Brené Brown's persona. Include empathetic statements like 'I deeply resonate with..', 'It's heartening to see..,' etc., to connect on an emotional level.
    
    8️⃣ Analogy:
    Hook: Introduce a thought-provoking analogy.
    Body: Elaborate on how the analogy applies to the topic.
    Personality: My default + Malcolm Gladwell's persona. Include insightful statements like 'It's akin to..', 'This reminds me of..,' etc., to draw creative comparisons.
    
    9️⃣ Disagree:
    Hook: Start with a respectful counterpoint or disagreement.
    Body: Provide a reasoned argument or alternative perspective.
    Personality: My default + Christopher Hitchens's persona. Include statements like 'While I see your point..', 'I respectfully disagree because..', to present a well-reasoned counterargument.
    
    * Make sure, you don't reply on this message. 
    
    ] `;
};

export const COMMENT_GENERATE_POST = (
  postText: string,
  postOwnerName: string
) => {
  return `
  [  

      Post-
      ${postText}

      Context Build: 
      Analyze the LinkedIn post to understand its core message. Extract and highlight key points, insights and core objective of the post. Determine the top three most relevant comment categories for the post based on the post's content and context.
      
      Select Three Comment Categories:
      
      Rejection Criteria: Exclude any category that only acknowledges the post without adding substantial insights or value.  
      
      a. First Category: Choose the category that provides the deepest and most valuable insights. Use a specific example from the post to illustrate this category. 
      
      b. Second Category: Select a category that offers data-driven insights for meaningful discussion. Incorporate a statistical example with a citation for credibility and a specific country. 
      
      c. Third Category: Choose a category that presents an emotional narrative, adding a personal and relatable touch to the comment.
      
      Generate Comments:
      
      a. Before crafting each comment, research credible sources online to build more context and add MEANINGFUL key gold nuggets of value into the comment.
      
      b.  Create nine unique and insightful comments, each under 175 characters, distributed across the selected categories. Ensure each comment introduces a new perspective and valuable insight.
      
      c.  Include specific reviews, ratings, quotes, or statements from the internet to enhance credibility. 
      
      d. Include bullet points of high-value pointers in each comment to enhance clarity and impact.

      ${postOwnerName ? " e. Include the post owner's name - " + postOwnerName + ' in some comments to create a direct and personalized connection.' : ''}
      
      Final Output:

      Send a string as output without \\n or \\
      Format: [{ "comment": "Your comment here", category : "Your category here" }]
    
    ]
  `;
};

export const COMMENT_GENERATE_POST_REFRESH = (
  typeOfComment: string,
  postText: string,
  postOwnerName: string
) => {
  return `
    Post-
    ${postText}

    I want you to refresh only the ${typeOfComment} comment.

    Send a string as output without \\n or \\
    Format: [{ "comment": "Your comment here", category : "Your category here" }]

    ${postOwnerName ? postOwnerName + ' should be included for a personal touch.' : ''}`;
};

// scripts/seedBackupContent.js
// Seeds the backup content pool — minimum 5 insights per profession
// Run: npm run seed

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BACKUP_CONTENT = [
  // ─── PRODUCT MANAGER ───────────────────────────────
  {
    profession_primary: 'Product Manager',
    pillar: 'career_growth',
    topic: 'visibility_vs_competence',
    hook_line: 'The PM who gets promoted isn\'t always the most skilled.',
    content: {
      hook: {
        text: 'There\'s a quiet rule in most product teams that nobody writes down: the person who gets promoted is rarely the most technically skilled person in the room. They\'re the person whose thinking is most visible to the people making promotion decisions.',
        type: 'uncomfortable_observation'
      },
      story: {
        paragraphs: [
          'Here\'s how it usually plays out. Two PMs join a team around the same time. Both are competent. Both do good work. One quietly executes everything assigned. The other does the same work — but also sends a brief weekly summary to their manager, flags risks before they become problems, and occasionally shares a relevant observation in team meetings.',
          'Six months later, one of them is being discussed for a senior role. It\'s not always the more technically skilled one. It\'s the one whose thinking has been visible across more conversations, documents, and decisions.',
          'This isn\'t about self-promotion. It\'s about the simple fact that managers can only advocate for what they\'ve seen. If your best thinking happens in your head or in closed Jira tickets, it\'s invisible. Invisible work doesn\'t build the track record that gets you promoted.',
          'The shift from PM to Senior PM is less about learning new skills and more about making your existing judgment visible to the right people at the right moments.'
        ]
      },
      insight: {
        headline: 'Competence gets you the work. Visibility gets you the promotion.',
        body: 'Promotions are decisions made by people who need to feel confident in you. That confidence comes from observing your judgment repeatedly — in meetings, in updates, in how you handle ambiguity. If your thinking isn\'t visible, it can\'t build that confidence.'
      },
      tiny_action: {
        instruction: 'Before your next standup, write one sentence about a risk you see that nobody has mentioned yet — then say it out loud.',
        timing: 'next standup'
      },
      reflection_prompt: {
        question: 'Did you do good work today that nobody really saw?',
        option_yes: 'Yeah, happens often',
        option_no: 'I made it visible'
      }
    }
  },
  {
    profession_primary: 'Product Manager',
    pillar: 'workplace_intelligence',
    topic: 'stakeholder_mapping',
    hook_line: 'Most PMs talk to the wrong stakeholders at the wrong time.',
    content: {
      hook: {
        text: 'Every PM knows they need stakeholder buy-in. What most don\'t realize is that buy-in has a timing problem — you can do everything right and still lose the room because you showed up at the wrong moment in the decision cycle.',
        type: 'industry_secret'
      },
      story: {
        paragraphs: [
          'Stakeholder management isn\'t about convincing people. It\'s about understanding when they\'re ready to be convinced. Most decisions in organizations are made in informal conversations before any formal meeting happens.',
          'The PM who wins the roadmap review is rarely the one with the best slides. It\'s the one who had the same conversation five times in private before the room convened. By the time the meeting starts, the outcome is already decided.',
          'Map your stakeholders by two dimensions: their influence on the decision, and how early they need to hear from you. The high-influence people need pre-alignment, not presentations.'
        ]
      },
      insight: {
        headline: 'By the time you\'re in the meeting, the real decision has already been made.',
        body: 'Formal meetings in organizations are for confirming what\'s been decided informally. If you\'re doing your stakeholder work in the meeting room, you\'re already behind. The work happens in the conversations before.'
      },
      tiny_action: {
        instruction: 'Identify one key stakeholder you haven\'t spoken to one-on-one this week and send them a short message today.',
        timing: 'before end of day'
      },
      reflection_prompt: {
        question: 'Was there a decision today you found out about too late?',
        option_yes: 'Yes, felt blindsided',
        option_no: 'Was in the loop'
      }
    }
  },
  {
    profession_primary: 'Product Manager',
    pillar: 'execution_productivity',
    topic: 'saying_no_gracefully',
    hook_line: 'The best PMs say no more often than they say yes.',
    content: {
      hook: {
        text: 'A product backlog is not a wish list — it\'s a series of tradeoffs. Every "yes" to one thing is a quiet "no" to something else. Most PMs know this. What they struggle with is saying the actual word.',
        type: 'relatable_truth'
      },
      story: {
        paragraphs: [
          'Saying no is a skill. It requires understanding what you\'re actually optimizing for, having enough confidence in your strategy to defend it, and a way to communicate the no that doesn\'t make the asker feel dismissed.',
          'The most effective version of no isn\'t a flat refusal. It\'s "here\'s what we\'re focused on right now, and here\'s why this doesn\'t fit" — followed by silence. You don\'t need to apologize for having a strategy.',
          'The PMs who struggle most with this have one thing in common: they haven\'t fully committed to a clear north star for the product. When you don\'t know what you\'re building toward, everything feels like it could be important.'
        ]
      },
      insight: {
        headline: 'A strategy without clear nos isn\'t a strategy — it\'s a wish.',
        body: 'Saying no protects the team\'s focus and the product\'s integrity. Every time you say yes to something that doesn\'t serve your core goal, you\'re implicitly saying the goal doesn\'t matter that much. Say no with clarity, not apology.'
      },
      tiny_action: {
        instruction: 'Look at your backlog and identify one item that\'s been there for over 30 days that you should formally close.',
        timing: 'right now'
      },
      reflection_prompt: {
        question: 'Did you say yes to something today that you shouldn\'t have?',
        option_yes: 'Probably did',
        option_no: 'Held the line'
      }
    }
  },
  {
    profession_primary: 'Product Manager',
    pillar: 'role_masterclass',
    topic: 'writing_good_prd',
    hook_line: 'A long PRD is usually a sign that nobody knows what they\'re building.',
    content: {
      hook: {
        text: 'The length of a product requirements document is inversely proportional to the clarity of the product thinking behind it. The more uncertain the PM is about what they\'re actually building, the more words they use trying to cover for it.',
        type: 'uncomfortable_observation'
      },
      story: {
        paragraphs: [
          'Good PRDs are short. Not because the feature is simple — but because the thinking is clear. A one-page spec that captures the problem, the user, the success metric, and the key constraints is more useful than a 20-page document full of edge cases nobody will read.',
          'The best test of a PRD: can an engineer who just joined the team read it and understand what you\'re trying to achieve — and why — in under five minutes? If not, it\'s not a spec. It\'s a thought dump.',
          'Write the success metric before you write anything else. If you can\'t complete the sentence "we\'ll know this worked when...", you\'re not ready to write the spec.'
        ]
      },
      insight: {
        headline: 'Write the success metric first. Everything else follows.',
        body: 'A product requirement without a measurable outcome is a feature request, not a strategy. Define what success looks like before you define how to build it. This one discipline will make your specs cleaner and your launches sharper.'
      },
      tiny_action: {
        instruction: 'Open your most recent spec and check if it has a single, measurable success metric. If not, add one today.',
        timing: 'right now'
      },
      reflection_prompt: {
        question: 'Do you know how you\'ll measure success on your current project?',
        option_yes: 'Crystal clear',
        option_no: 'Still fuzzy'
      }
    }
  },
  {
    profession_primary: 'Product Manager',
    pillar: 'mental_clarity',
    topic: 'context_switching_cost',
    hook_line: 'Every meeting you call costs more than you think.',
    content: {
      hook: {
        text: 'Studies on knowledge work consistently show that it takes about 23 minutes to regain full focus after an interruption. A 30-minute meeting doesn\'t cost 30 minutes — it costs 30 minutes plus two separate 23-minute recovery periods for each person in the room.',
        type: 'surprising_fact'
      },
      story: {
        paragraphs: [
          'PMs are meeting-heavy by nature. The job involves alignment, coordination, and communication. But there\'s a difference between meetings that move work forward and meetings that just feel like work.',
          'The most expensive meetings are the "quick syncs" and "just checking in" calls that could have been a Slack message — or nothing at all. They interrupt the deep work of engineers, designers, and analysts who need sustained concentration to do their best work.',
          'The best PMs protect their team\'s time as fiercely as they protect their product\'s scope. Before scheduling anything, ask: what decision gets made in this meeting that can\'t be made asynchronously?'
        ]
      },
      insight: {
        headline: 'Meeting time is team time. Spend it like it\'s scarce.',
        body: 'Every unnecessary meeting is a tax on your team\'s ability to think deeply. Apply the same rigor you bring to feature prioritization to your calendar. Cancel one meeting this week that could be an update instead.'
      },
      tiny_action: {
        instruction: 'Look at your meetings for tomorrow and identify one that could be replaced with a written update instead.',
        timing: 'end of day today'
      },
      reflection_prompt: {
        question: 'Did you attend a meeting today that didn\'t need you there?',
        option_yes: 'Yes, wasted time',
        option_no: 'Was the right call'
      }
    }
  },

  // ─── SOFTWARE ENGINEER ────────────────────────────────
  {
    profession_primary: 'Software Engineer',
    pillar: 'workplace_intelligence',
    topic: 'technical_communication',
    hook_line: 'The best engineers write as well as they code.',
    content: {
      hook: {
        text: 'There\'s a quiet career ceiling that many engineers hit around year 3-5. Not because they aren\'t technically excellent — they are. But because their technical excellence lives only in their code, and nobody outside their immediate team can see it.',
        type: 'uncomfortable_observation'
      },
      story: {
        paragraphs: [
          'The engineers who advance fastest aren\'t necessarily the ones who write the cleanest code. They\'re the ones who can explain what they built, why they chose that approach, and what the tradeoffs were — in plain language that a PM or a manager can act on.',
          'Technical writing is a leverage multiplier. A well-written design doc turns one engineer\'s thinking into a team decision. A clear incident writeup prevents the next outage. A concise PR description makes code review faster for everyone.',
          'The investment is small. The return is enormous. Every engineer who learns to write clearly about technical decisions becomes more influential than their code alone could make them.'
        ]
      },
      insight: {
        headline: 'Code is how you build. Writing is how you lead.',
        body: 'Technical influence extends far beyond the code you write. Engineers who can communicate the \'why\' behind technical decisions — in docs, in meetings, in Slack — earn the trust and visibility that accelerates their careers.'
      },
      tiny_action: {
        instruction: 'Add a one-paragraph summary to your next PR explaining the why behind the approach, not just what it does.',
        timing: 'next PR you open'
      },
      reflection_prompt: {
        question: 'Did someone on your team today not understand a decision you made?',
        option_yes: 'Could have explained better',
        option_no: 'Communication was clear'
      }
    }
  },
  {
    profession_primary: 'Software Engineer',
    pillar: 'execution_productivity',
    topic: 'deep_work_engineering',
    hook_line: 'The 4-hour engineer often outproduces the 8-hour one.',
    content: {
      hook: {
        text: 'Software engineering is one of the last remaining professions where the quality of your output scales almost entirely with the quality of your attention — not the quantity of your hours. Four hours of uninterrupted focus produces more than eight hours of fragmented work.',
        type: 'surprising_fact'
      },
      story: {
        paragraphs: [
          'The best engineering work happens in a state of flow — that mental state where a problem becomes fully held in your head and solutions emerge almost automatically. Flow takes about 20 minutes to enter and is destroyed instantly by a Slack notification, a Zoom meeting, or someone stopping by your desk.',
          'Most engineering environments are actively hostile to flow. Open offices, constant Slack pings, back-to-back meetings — these aren\'t signs of a productive team. They\'re signs of a team that has confused activity with output.',
          'Protecting your deep work hours isn\'t a productivity hack. It\'s what professional engineering actually requires. The engineers who do this consistently — even imperfectly — produce disproportionately more than those who let their days get fragmented.'
        ]
      },
      insight: {
        headline: 'Focus is the raw material of great engineering. Protect it.',
        body: 'You cannot think deeply in small, interrupted fragments. Engineering problems require sustained concentration to solve well. The best thing you can do for your output today is create a block of time where nothing can reach you.'
      },
      tiny_action: {
        instruction: 'Block two consecutive hours on your calendar tomorrow with no meetings and your phone on silent for deep work.',
        timing: 'right now'
      },
      reflection_prompt: {
        question: 'Did you get any uninterrupted focus time today?',
        option_yes: 'Yes, had good focus',
        option_no: 'Completely fragmented'
      }
    }
  },
  {
    profession_primary: 'Software Engineer',
    pillar: 'career_growth',
    topic: 'senior_engineer_transition',
    hook_line: 'Seniority is about judgment, not syntax.',
    content: {
      hook: {
        text: 'The gap between a mid-level and senior engineer isn\'t measured in lines of code or years of experience. It\'s measured in judgment — specifically, the ability to make good decisions with incomplete information and defend them under pressure.',
        type: 'relatable_truth'
      },
      story: {
        paragraphs: [
          'Junior engineers ask "how do I build this?" Mid-level engineers ask "what\'s the best way to build this?" Senior engineers ask "should we build this at all, and if yes, which part first?" The questions change more than the skills.',
          'Senior engineers are defined by how they handle ambiguity. They can start moving on a problem before the spec is complete. They know when to ask for clarification and when to make a reasonable assumption and document it.',
          'The transition isn\'t about learning more technologies. It\'s about learning to think at a system level — how does this component interact with everything else? What breaks if we change this? What happens at 10x scale?'
        ]
      },
      insight: {
        headline: 'Seniority is measured by the quality of your questions, not your answers.',
        body: 'The most senior engineers in any room are often the ones asking the simplest, most fundamental questions. "What problem are we actually solving?" and "What could go wrong?" are senior questions. They reveal judgment.'
      },
      tiny_action: {
        instruction: 'In your next technical discussion, ask "should we build this at all?" before diving into how.',
        timing: 'next technical discussion'
      },
      reflection_prompt: {
        question: 'Did you question whether the problem itself was right today?',
        option_yes: 'Challenged assumptions',
        option_no: 'Just executed'
      }
    }
  },
  {
    profession_primary: 'Software Engineer',
    pillar: 'role_masterclass',
    topic: 'code_review_culture',
    hook_line: 'Code review is a conversation, not a judgment.',
    content: {
      hook: {
        text: 'Most code reviews are either too lenient (rubber stamps) or too harsh (gatekeeping sessions that demoralize the author). Very few are what they should be: a conversation between two people trying to make the codebase better together.',
        type: 'relatable_truth'
      },
      story: {
        paragraphs: [
          'The quality of a team\'s code reviews reflects the quality of its psychological safety. Teams where people are afraid to be wrong write comments that are defensive or aggressive. Teams with high trust write comments that are curious and constructive.',
          'Good review comments do two things: they explain why something is a concern (not just that it is), and they suggest an alternative or ask a question rather than just pointing out the problem.',
          'As the person being reviewed, the skill is not taking feedback personally. The code is not you. Feedback on the code is an attempt to make the product better — not a judgment of your intelligence or value.'
        ]
      },
      insight: {
        headline: 'The best code review comment is a question, not a command.',
        body: 'Questions invite dialogue and show respect for the author\'s intent. Commands create defensiveness. "What happens if this returns null?" opens a conversation. "Handle the null case" shuts one down.'
      },
      tiny_action: {
        instruction: 'In your next code review, turn at least one critical comment into a question instead.',
        timing: 'next code review'
      },
      reflection_prompt: {
        question: 'Did you give or receive a code review comment that felt more like criticism than collaboration?',
        option_yes: 'Yeah, it stung',
        option_no: 'Felt collaborative'
      }
    }
  },
  {
    profession_primary: 'Software Engineer',
    pillar: 'mental_clarity',
    topic: 'imposter_syndrome_engineering',
    hook_line: 'Most engineers feel less competent than they actually are.',
    content: {
      hook: {
        text: 'There\'s a consistent finding in software engineering: the more experienced a developer becomes, the more aware they are of everything they don\'t know. Paradoxically, this makes experienced engineers feel less confident than beginners — who don\'t yet know what they don\'t know.',
        type: 'surprising_fact'
      },
      story: {
        paragraphs: [
          'Imposter syndrome in engineering is almost universal. The field is enormous, changes constantly, and every team uses different stacks, different patterns, different conventions. There is no engineer alive who knows all of it. The feeling of not knowing enough is not a personal failing — it\'s an accurate description of the field.',
          'The engineers who look most confident in meetings aren\'t necessarily more competent. They\'re often just more comfortable with uncertainty — better at acting on incomplete information without catastrophizing.',
          'The antidote isn\'t knowing more. It\'s separating "I don\'t know this yet" from "I\'m not good enough." The first is about a specific gap. The second is a false conclusion.'
        ]
      },
      insight: {
        headline: 'Not knowing something is a starting point. It\'s not a verdict.',
        body: 'Every engineer learns by not knowing things first. The gap between where you are and where you want to be is not a problem. It\'s the job. Your value isn\'t measured by what you already know — it\'s measured by what you figure out.'
      },
      tiny_action: {
        instruction: 'Write down one technical thing you\'ve learned in the last two weeks that you didn\'t know before.',
        timing: 'end of day'
      },
      reflection_prompt: {
        question: 'Did you feel like you knew less than you should today?',
        option_yes: 'Felt out of depth',
        option_no: 'Felt capable'
      }
    }
  },

  // ─── HR & PEOPLE ──────────────────────────────────────
  {
    profession_primary: 'HR & People',
    pillar: 'workplace_intelligence',
    topic: 'hiring_bias_awareness',
    hook_line: 'Most hiring decisions are made in the first four minutes.',
    content: {
      hook: {
        text: 'Research consistently shows that interviewers form strong impressions of candidates within the first four minutes of meeting them — then spend the rest of the interview looking for evidence to confirm that impression. This is not a character flaw. It\'s how human cognition works.',
        type: 'surprising_fact'
      },
      story: {
        paragraphs: [
          'The problem isn\'t that we have first impressions. The problem is that we treat them as reliable data. The candidate who reminds you of someone competent you already know gets points they didn\'t earn. The one who makes you slightly uncomfortable loses points for reasons you can\'t articulate.',
          'Structured interviews — same questions, same order, scored against predefined criteria — reduce this bias significantly. Not because they\'re perfect, but because they force evaluators to measure candidates against the role, not against each other or against an unconscious template.',
          'As an HR professional, your leverage point isn\'t eliminating bias (impossible). It\'s designing processes that surface it and reduce its influence on decisions.'
        ]
      },
      insight: {
        headline: 'Better hiring processes don\'t remove bias — they make it harder to act on.',
        body: 'The goal of structured hiring is not to make you unbiased. It\'s to put guardrails between your initial impression and the hiring decision. Consistency, documentation, and defined criteria create those guardrails.'
      },
      tiny_action: {
        instruction: 'Review your current interview questions and identify one that is open to subjective interpretation — then rewrite it with a clearer evaluation criterion.',
        timing: 'this week'
      },
      reflection_prompt: {
        question: 'Did you make a judgment about someone today based on feeling rather than evidence?',
        option_yes: 'Caught myself',
        option_no: 'Used evidence'
      }
    }
  },
  {
    profession_primary: 'HR & People',
    pillar: 'role_masterclass',
    topic: 'difficult_conversations',
    hook_line: 'The conversation you\'re avoiding is usually the one that matters most.',
    content: {
      hook: {
        text: 'Every week in most organizations, there are three or four conversations that nobody is having — but everyone knows should happen. The feedback that wasn\'t given. The performance issue that was hinted at but not named. The team dynamic that everyone talks about except to the person causing it.',
        type: 'relatable_truth'
      },
      story: {
        paragraphs: [
          'HR professionals sit at the intersection of all of this. You know about the conversations that aren\'t happening. You hear about them from managers who aren\'t sure how to raise something, from employees who feel something is wrong but can\'t name it, from leaders who need someone to help them say a hard thing.',
          'The reason these conversations get avoided isn\'t cowardice. It\'s uncertainty about how to have them without making things worse. The fear isn\'t the conversation itself — it\'s the aftermath.',
          'The most effective approach isn\'t a script or a framework. It\'s a clear understanding of the goal: what outcome are you trying to reach? Start from there, not from what you need to say.'
        ]
      },
      insight: {
        headline: 'A delayed hard conversation almost always becomes a harder one.',
        body: 'Every week you avoid a conversation that needs to happen, the situation compounds. The person gets more entrenched in behavior that isn\'t working. The team adjusts around it in unhealthy ways. Start from the outcome you want and move toward it, one conversation at a time.'
      },
      tiny_action: {
        instruction: 'Identify one conversation you\'ve been putting off for more than two weeks and schedule it for this week.',
        timing: 'right now'
      },
      reflection_prompt: {
        question: 'Is there a conversation you\'ve been postponing that you know needs to happen?',
        option_yes: 'Yes, avoiding it',
        option_no: 'Up to date'
      }
    }
  },
  {
    profession_primary: 'HR & People',
    pillar: 'career_growth',
    topic: 'hr_strategic_seat',
    hook_line: 'HR still fights for a seat at the table it already earned.',
    content: {
      hook: {
        text: 'There\'s a persistent tension in HR: the function is responsible for the organization\'s most important asset (its people) but frequently operates in a support role rather than a strategic one. This isn\'t just a leadership problem. It\'s often a self-positioning problem.',
        type: 'uncomfortable_observation'
      },
      story: {
        paragraphs: [
          'Strategic HR professionals have one thing in common with their more operational counterparts: the same tasks, the same data, often the same constraints. What\'s different is how they frame their work — not as people administration, but as business enablement.',
          'The difference between "we\'re seeing high turnover in engineering" and "turnover in engineering is costing us roughly $800k annually and slowing delivery by an estimated 15%" is not just vocabulary. It\'s a different way of thinking about the work.',
          'When you speak the language of business outcomes — not HR metrics — you get invited into different conversations. That\'s the path to the strategic seat: not by asking for it, but by making your work undeniably relevant to what leaders actually care about.'
        ]
      },
      insight: {
        headline: 'HR earns strategic influence by measuring what the business measures.',
        body: 'Leaders care about growth, cost, risk, and speed. Every HR issue — turnover, engagement, hiring, development — can be connected to these. Make that connection explicit, consistently, and you stop being a support function and start being a business partner.'
      },
      tiny_action: {
        instruction: 'Take one HR metric you report regularly and translate it into a business impact number before your next leadership meeting.',
        timing: 'before next meeting'
      },
      reflection_prompt: {
        question: 'Did you connect an HR outcome to a business metric today?',
        option_yes: 'Made the link',
        option_no: 'Still separate'
      }
    }
  },
  {
    profession_primary: 'HR & People',
    pillar: 'execution_productivity',
    topic: 'onboarding_effectiveness',
    hook_line: 'The first 90 days decide whether a hire stays for 3 years.',
    content: {
      hook: {
        text: 'Research on employee retention consistently shows that the decision to stay or leave a company is largely formed in the first 90 days. Not at the 2-year review. Not after the first performance cycle. In the first three months, when a new employee is deciding whether the reality matches the promise.',
        type: 'surprising_fact'
      },
      story: {
        paragraphs: [
          'Most onboarding programs are designed around information transfer: here\'s the handbook, here are the tools, here are the people you\'ll work with. This misses what new employees actually need in the first 90 days: clarity on what success looks like for them specifically, and early wins that confirm they made the right decision.',
          'The best onboarding creates intentional "I made the right choice" moments in the first two weeks. A manager who\'s clearly prepared for them. A meaningful task that uses their actual skills. Someone who proactively makes them feel like they belong.',
          'If your onboarding program is just logistics and paperwork, you\'re leaving the most critical window for retention unmanaged.'
        ]
      },
      insight: {
        headline: 'Retention starts at day one, not at the exit interview.',
        body: 'By the time someone\'s thinking about leaving, the decision is usually 80% made. The work of retention is in the early experience — making someone feel competent, connected, and clear on how they fit. Onboarding is your biggest retention lever.'
      },
      tiny_action: {
        instruction: 'Check in with one employee who joined in the last 60 days and ask specifically: "Is there anything you expected that hasn\'t happened yet?"',
        timing: 'today or tomorrow'
      },
      reflection_prompt: {
        question: 'Do you know how new joiners are actually experiencing their first weeks?',
        option_yes: 'Have real insight',
        option_no: 'Going on assumption'
      }
    }
  },
  {
    profession_primary: 'HR & People',
    pillar: 'mental_clarity',
    topic: 'hr_emotional_load',
    hook_line: 'HR absorbs everyone else\'s stress. Who absorbs yours?',
    content: {
      hook: {
        text: 'HR professionals spend their days holding other people\'s problems. Redundancies. Conflicts. Underperformance. Grief. Anxiety about the future. The job requires genuine empathy and containment — but few organizations have any real support structure for the people doing that emotional work.',
        type: 'relatable_truth'
      },
      story: {
        paragraphs: [
          'Emotional labor is real and has a cost. When you sit across from someone who just lost their job, or mediate a conflict between two people who genuinely dislike each other, or deliver difficult feedback on behalf of a manager who couldn\'t say it themselves — you absorb some of that weight.',
          'The organizational design problem is that HR sits at the intersection of all the organization\'s hardest human moments, with very little peer support for processing it. You\'re expected to be professional, composed, and boundaried — all the time.',
          'The most effective HR professionals actively manage their own emotional capacity: they debrief after hard conversations, they maintain clear boundaries about what they carry, and they have someone outside the organization they can talk to honestly.'
        ]
      },
      insight: {
        headline: 'You can\'t pour from an empty vessel. Your wellbeing is a professional responsibility.',
        body: 'If you burn out, you can\'t support the people you\'re there to support. Protecting your own emotional capacity isn\'t selfish — it\'s a professional requirement. Name the weight you carry, then put some of it down.'
      },
      tiny_action: {
        instruction: 'After your next difficult conversation at work, write three sentences about how it felt before you move on to the next task.',
        timing: 'after next hard conversation'
      },
      reflection_prompt: {
        question: 'Did you process a difficult interaction today, or just push through it?',
        option_yes: 'Pushed through',
        option_no: 'Processed it'
      }
    }
  },

  // ─── FOUNDER ─────────────────────────────────────────
  {
    profession_primary: 'Founder',
    pillar: 'execution_productivity',
    topic: 'founder_leverage',
    hook_line: 'Most founders are working on the wrong things.',
    content: {
      hook: {
        text: 'The most dangerous stage in a startup isn\'t when you\'re failing. It\'s when you\'re busy. Busy with the wrong things. Building instead of selling. Optimizing instead of validating. Moving fast in a direction nobody actually wants to go.',
        type: 'uncomfortable_observation'
      },
      story: {
        paragraphs: [
          'Founders are uniquely susceptible to productive-feeling busy work. There\'s always something to build, always a process to optimize, always a deck to perfect. These things feel like progress. They\'re often a substitute for the harder, more ambiguous work of finding out whether anyone actually wants what you\'re making.',
          'The highest-leverage activities for most founders — especially pre-product-market fit — are customer conversations and anything that directly moves toward the first or next dollar. Everything else is secondary.',
          'The question to ask yourself at the end of every week: what did I do this week that couldn\'t have been done by someone who isn\'t the founder? The answer to that is your actual job.'
        ]
      },
      insight: {
        headline: 'Founder work is what only the founder can do. Everything else is delegation.',
        body: 'Your leverage as a founder is unique: you carry the vision, the relationships, and the credibility. Tasks that don\'t require that leverage are tasks you\'re borrowing from your actual job. Build, yes — but sell, validate, and decide first.'
      },
      tiny_action: {
        instruction: 'List the three things you did yesterday. Identify which one only you could have done. That\'s the signal.',
        timing: 'right now'
      },
      reflection_prompt: {
        question: 'Did you do founder work today, or just company work?',
        option_yes: 'Was in founder mode',
        option_no: 'Got lost in tasks'
      }
    }
  }
];

async function seed() {
  console.log('🌱 Seeding backup content pool...');

  let created = 0;
  let skipped = 0;

  for (const item of BACKUP_CONTENT) {
    try {
      const existing = await prisma.backupContent.findFirst({
        where: {
          profession_primary: item.profession_primary,
          topic: item.topic
        }
      });

      if (existing) {
        console.log(`  ⏭️  Skipping existing: ${item.profession_primary} — ${item.topic}`);
        skipped++;
        continue;
      }

      await prisma.backupContent.create({ data: item });
      console.log(`  ✅ Created: ${item.profession_primary} — ${item.topic}`);
      created++;

    } catch (error) {
      console.error(`  ❌ Failed: ${item.profession_primary} — ${item.topic}:`, error.message);
    }
  }

  const total = await prisma.backupContent.count();
  console.log(`\n📊 Backup content pool: ${total} total items (${created} created, ${skipped} skipped)`);
  console.log('✅ Seed complete!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

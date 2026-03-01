# WORKFLOW.md — Growth Engine

## Content Production Pipeline

```
Cron trigger / Executive request
    ↓
Check Intel feed for hooks (shared/intel/)
    ↓
Draft content in founder's voice (VOICE.md)
    ↓
Save to shared/content/drafts/{platform}/
    ↓
Human review (founder approves/revises)
    ↓
Post via API or flag for manual posting
    ↓
Log to shared/content/published/
```

## Email Campaign Workflow

```
Intel Engine delivers lead list
    ↓
Segment leads by fit score and stage
    ↓
Draft email sequence (match to segment)
    ↓
Human review of sequence
    ↓
Launch campaign (Instantly.ai)
    ↓
Monitor metrics, report weekly
    ↓
Adjust based on performance
```

## Content Types & Cadence

| Type | Frequency | Platform | Format |
|---|---|---|---|
| Thought leadership | 3x/week | LinkedIn | Long-form post |
| Product insight | 1x/week | LinkedIn | Short post + visual |
| Hot takes | Daily | X/Twitter | 1-2 sentences |
| Engagement threads | 2x/week | X/Twitter | Thread (3-5 tweets) |
| Behind-the-scenes | 3x/week | Instagram | Photo/story + caption |
| Cold outreach | Ongoing | Email | 3-4 email sequence |
| Nurture drip | Ongoing | Email | 4 email sequence |

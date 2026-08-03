# Widget Configuration

Every widget contains:

id

title

description

type

source

period

aggregation

category

displayOrder

visible

options

Example

id: sleep-trend

title: Sleep Trend

type: line-chart

source: sleep

period: 30d

aggregation: daily

category: Health

displayOrder: 2

visible: true

options:
showAverage: true

Backend always returns

id

title

type

subtitle

data

meta

Example

{

id

title

type

subtitle

data

meta

}

The frontend never interprets entries directly.

It only renders the response.

## Final recommendation

One addition I'd make before you start implementing configs is to classify every widget by its **scope**, because this will make querying and execution much cleaner:

- **Global** – e.g. Life Score trend, XP, streaks.
- **Goal** – e.g. Sleep trend, Protein progress, Steps history.
- **Category** – e.g. Health score, Lifestyle progress, Fitness consistency.
- **Insight** – derived information like "Most Improved Goal" or "Best Category".

That single field (`scope`) will make the executor selection much cleaner and will let you build configurable dashboards without special-case logic later.

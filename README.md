# ✧ Celestial Reading

Enter your birthday and get your full astrological reading: a birth chart, plus **daily, weekly and monthly guidance** on what to focus on, worked out from real planetary positions.

## Features

- **Birth chart:** Sun, Moon, Mercury, Venus, Mars, Jupiter and Saturn placements, a chart wheel with aspects, element balance, Life Path number and Chinese zodiac sign.
- **Rising sign and houses:** add your birth time and city to get your Ascendant, Midheaven and whole-sign houses. The city search finds coordinates and the historical time zone, including daylight saving time.
- **Today:** the Moon's sign, phase and house focus, a "What you need to do" checklist, things to avoid, love/career/wellness/money ratings, and a lucky number, color and hour.
- **This week:** a 7-day energy strip with your best days and the ones to take easy, moon phases and planets changing sign.
- **This month:** an energy calendar, power days, new and full moons, retrogrades and key dates.
- **Morning brief:** the top of Today shows your energy, best start time, one thing to do, one to avoid and what to wear.
- **Year Ahead:** your solar return (the chart for your birthday) sets the themes for the next 12 months, with a month-by-month guide, personal year number, and a retrograde and eclipse planner with checklists. One click exports it all to your calendar (.ics) with a reminder the day before each event.
- **Life Cycles:** your Saturn returns, squares and oppositions and your Jupiter returns, calculated for your chart, plus typical milestones like the midlife Uranus opposition. Each one comes with a "how to prepare" checklist.
- **Career & Money:** your money style, blind spots and habits that suit you, and the best dates and hours in the next 60 days for interviews, raises, launches and contracts.
- **Love & Match:** a compatibility checker for any two people: an overall score, chemistry, communication, emotional bond, long-term stability, and tips.
- **Journal & Goals:** set an intention each New Moon, check in at the Full Moon, and keep a daily mood journal. After 5 entries it shows how your moods line up with the Moon.
- **Profiles:** save yourself, family, partners and friends on this device and switch between them.
- **PDF report:** print or save your full reading as a clean PDF.
- **Install it:** add it to your phone or desktop home screen. It works offline after the first visit.
- **Career:** the work that fits your Midheaven, Sun, career-house ruler, Jupiter and Saturn, plus how you earn best. Your ideal partner from your Descendant, Venus, Mars and Moon, with your most compatible signs and Life Path numbers.
- **Luck & Numbers:** the best planetary hours each day to start important work, your luckiest days for the next 60 days, the best months of the coming year, and Jupiter's lucky years through your houses. Also your personal numbers and a house number calculator that reduces any address to one digit and compares it with your Life Path. Lottery and games of chance stay random: the app says so and doesn't claim to change the odds.
- **Places & Car:** relocation astrology ranks countries and US states where Jupiter, Venus or the Sun sit on an angle of your chart. You also get a car style, example models and colors for your chart, and a build-year checker for cars and houses (number and Chinese zodiac year).
- **Optional account sync:** sign in with an email link to back up your profiles, journal, moon goals and settings and see them on all your devices. Without signing in, everything stays only in your browser.
- **English and French:** switch with the EN/FR button in the header. French is chosen automatically when the browser is set to French, and dates use day/month/year.
- **Horoscopes to share** (`share.html`): daily or monthly horoscopes for all 12 signs, calculated from the real Moon and planet positions. Daily cards carry the full day's reading (overview, Moon, love, career, wellness and money, what to do and avoid, lucky number, color and hour) and a cover showing the luckiest sign. Both come as 1080×1350 image cards plus a cover. One click downloads a bundle of 13 images, a PDF guide and a suggested post caption, in English or French. Your brand name is printed at the top of every card.
- You can move to past or future days, weeks and months, and your birth details are remembered on your device.

## How it works

Planet positions use Paul Schlyter's low-precision orbital formulas (accurate to about 1°), with the main lunar, Jupiter and Saturn perturbation terms. Readings come from where planets are in the sky now, compared with your chart. Plain HTML, CSS and JavaScript: no build step and no dependencies. City lookup uses the free [Open-Meteo geocoding API](https://open-meteo.com/en/docs/geocoding-api).

## Account sync (Supabase)

Sync uses a Supabase project (`celestial-reading`). Each profile, journal day, goal and setting is one row in `sync_items` (schema in `supabase/migrations/`), protected by row-level security so people can only read their own rows. When the same item changes on two devices, the newest edit wins, and deletions sync too. The publishable key in `js/sync.js` is meant to be public.

One-time setup in the Supabase dashboard:

1. **Authentication → URL Configuration:** set the Site URL to `https://laminedo.github.io/celestial-reading/`, and add that URL plus `http://127.0.0.1:5173/` under Redirect URLs.
2. **Authentication → Emails → SMTP settings:** add your own email provider (for example Resend, Postmark or SendGrid). Supabase's built-in sender only emails members of your Supabase team, and only a few emails per hour.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
node serve.js
```

Then visit http://127.0.0.1:5173.

---

*For reflection and entertainment.*

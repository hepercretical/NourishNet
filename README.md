# NourishNet

NourishNet is a mobile-first web app for tracking daily calories, protein, carbohydrates,
and fat. As a web app, it uses React and vite. The frontend is hosted with Netlify and the backend is hosted using Neon. Both services allow for deploying smaller projects for free.

## Instructions for Build and Use

Steps to build and/or run the software:

1. Visit the website: https://thenourishnet.netlify.app/
(The web app is currently private on netlify until it is ready for public testing or release.)

Instructions for using the software:

1. Create anaccount or sign in with an existing account.
2. Navigate the app with the tabs at the bottom of the screen.
3. Review calories and macros on Dashboard, open the daily summary, or use Stats to view
   recorded progress. Goals and appearance settings are under Preferences.
4. Log foods and weight to start tracking your health journey.

## Development Environment

To recreate the development environment, you need the following software and/or libraries with the specified versions:

* Node.js 24.x with npm, JavaScript/JSX, HTML, and plain CSS.
* React 19.3.1 and Vite 8.3.7; PostgreSQL through the backend's pg 8.23.1 driver,
  with Neon PostgreSQL used for hosted storage.
* Vitest 5.1.0, React Testing Library 16.3.3, ESLint 10.14.0, and Prettier 3.9.10.

## Useful Websites to Learn More

I found these websites useful in developing this software:

* [React documentation](https://react.dev/learn)
* [Vite documentation](https://vite.dev/guide/)
* [Neon documentation](https://neon.com/docs)

## Future Work

The following items I plan to fix, improve, and/or add to this project in the future:

* [ ] Add friend connections and optional sharing of selected goal progress.
* [ ] Add more data into the database to make the web app usable by anyone.
* [ ] Finish security and legal review of things that should be done before a public release.

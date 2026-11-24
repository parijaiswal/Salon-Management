I have added AGENTS.md in the project root and three documents in the docs folder. Please read all of them before doing anything else. Do not write any code yet.

First, summarise what the app does in points. Then tell me if anything in the documents is unclear or missing, for example how the PIN screens should work, or what should happen to a Called customer if their barber goes on break.
Also suggest the simplest way to keep the phone, tablet and TV screens in sync, and explain your choice in 3 lines. Please share your plan and wait for my approval before building.

Before moving on, please check Home, Join Queue and My Status against docs/02-screens.md and fix anything that does not work. Tell me what was wrong and which files you changed. Do not touch other screens.  and also it is taking quiet long loading time to load a single page

Now build the Reception Dashboard, the Barber View and the Waiting Area TV display, as described in docs/02-screens.md. Customers who join from a phone should appear on Reception automatically. Call next must follow the barber preference rules in docs/03-flows-rules.md, for example Amit should never be given a customer who chose Ravi. Start, Done, On Break, No-show and Cancel must update all screens through Firestore. The TV text should be large enough to read from 5 metres. Do not change the screens that are already built. List the changed files and how to test each screen.

Please build the Owner Settings screen: turning off a service hides it from the Join page, closing the queue disables the Join button with a clear message, and the stats cards show customers served, average wait and no-shows. Then add friendly empty states on the new screens. Do not change the other screens. List the changed files and how to test. and also one thing at last could you also explain me how this all will come together

okay one thing when a customer is assigned to barber then all the barber dashboard it when I clicked on the start button time left shows 00:00 all the time so fix that bug 


Flows & Rules
Flow: remote customer
Opens Home -> Join -> picks Haircut + "Any barber" -> gets token S-14, 6th in line.
Watches My Status from home; when 2nd in line, sees "Start coming to the salon".
Receptionist taps Call next on Amit's card -> S-14 becomes "Called".
Customer's phone shows "It's your turn! Go to Amit"; TV flashes S-14.
Customer arrives; Amit taps Start, then Done -> S-14 leaves the queue.
Flow: walk-in

Receptionist taps + Add walk-in -> enters name, phone, services, preferred barber -> customer joins the same queue at the end (first come, first served) and gets a token.

Flow: no-show

Customer is Called but does not arrive -> after 10 min the receptionist can mark No-show. If the customer arrives later, they are added again at the END with a new token.

Statuses and allowed moves
Waiting -> Called -> In chair -> Done. Never backwards.
Waiting -> Cancelled.
Called -> No-show.


Rules
First come, first served.
Call next for barber X picks the earliest Waiting customer who chose X or "Any".
A customer who chose Ravi is never given to another barber.
A barber has only one customer in the chair at a time.
Waiting time ≈ total minutes of services ahead ÷ number of barbers working.
One active spot per phone number; a second attempt shows the existing spot.
A customer can choose at most 3 services.
Tokens are numbered S-1, S-2, ... in order of joining, and a re-added no-show gets a new token.
Online joining closes 30 min before closing time; walk-ins are still allowed.
Barber on break: customers who chose that barber see "Ravi is on break"; "Any" customers are not assigned to that barber.
A barber on break cannot receive a new customer until they become available.
Owner closing the queue disables the Join button with a clear message; existing customers are not affected.
Turning off a service hides it from Join; customers already in the queue keep it.
Reception, Barber and Admin screens require a PIN.



Test checklist
Join with 2 services -> correct total time and price shown
Selecting a 4th service is blocked
Invalid phone number shows an error
Same phone joins twice -> shown existing spot, no duplicate
Call next for Amit skips a customer who chose Ravi
Call next -> customer's phone shows "It's your turn" within 5 s
Start/Done on Barber View updates Reception and TV
Barber has only one customer in the chair at a time
No-show, then re-add -> goes to end of queue with new token
Cancel my spot asks for confirmation and removes the customer
Barber on break -> chosen customers see "Ravi is on break"
Close online queue -> Join button disabled with message
Turning off a service hides it from Join
Language toggle switches all labels to Gujarati
Waiting time goes down as customers finish
Phone, tablet and TV windows all stay in sync
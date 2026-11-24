Screens & Features

Global: light cream (#FFF7ED) + burgundy (#7F1D1D) theme, white rounded cards, dark text (#292524), cream text on burgundy buttons, tap targets at least 44px, EN/GU toggle in the top-right of every screen. All text comes from the language file.

Screen 1: Home (/) - phone

Who: customers.

Salon name + logo at top; badge "Open · Closes 9 PM" (burgundy) or "Closed" (grey)
Live card: "6 people waiting · about 50 min"
Barber chips with status: Ravi (busy) · Amit (free) · Imran (on break)
Big burgundy button [ Join Queue ] -> /join
Queue closed state: button disabled, message "Online joining is closed. Walk-ins are welcome!"
Empty state: "No one waiting - walk right in!"
Screen 2: Join Queue (/join) - phone

Who: customers joining remotely.

Name field (required)
Phone field (exactly 10 digits, validated, error message below field)
Service cards, multi-select, max 3: Haircut 30 min ₹150, Beard trim 15 min ₹80, Hair spa 45 min ₹400, Hair colour 60 min ₹500, Head massage 15 min ₹100. Selected cards get a burgundy border and tick.
Barber picker: "Any barber (fastest)" or a barber photo card (name + On break label if applicable)
Live summary bar: "Total 45 min · ₹230 · Expected wait ~35 min", updates as selections change
[ Confirm ] -> creates token, goes to My Status
Errors: invalid phone, no service selected, 4th service blocked with message "Maximum 3 services". If the phone already has an active spot, show that spot instead of creating a new one.
Screen 3: My Status (/status/:id) - phone

Who: the customer after joining.

Large token "S-14" and position "4th in line"
Circular countdown "about 35 min"; refreshes automatically
Selected barber and services listed below
When 2nd in line: banner "Start coming to the salon"
When called: full-screen burgundy with cream text "It's your turn! Go to Ravi", large text, gentle pulse, phone vibration
If chosen barber is on break: notice "Ravi is on break"
[ Cancel my spot ] with a confirmation pop-up ("Are you sure?" Yes / No)
Cancelled / no-show state: message and a button to join again
Screen 4: Reception Dashboard (/reception) - tablet landscape

Who: receptionist. Protected by a PIN.

Top: [ + Add walk-in ] opens a quick form (name, phone, services, preferred barber)
Left: barber cards in a 3-column row: barber name, current customer, time-left progress bar, [ Call next ]
Right: waiting list in order: token, name, services, preferred barber, waiting time, [ No-show ] [ Cancel ]
Customers waiting more than 60 min are highlighted in amber
Empty state: "No one waiting"
New online joiners appear automatically
Screen 5: Barber View (/barber/:name) - phone

Who: each barber. Protected by a PIN.

Current customer: name, services, timer since start
Big buttons: [ Start ] then [ Done ]
"Next for you: S-15 Kunal (Haircut)"
Toggle: On break / Available
Empty state: "No customer right now"
Screen 6: Waiting Area TV (/display) - TV, landscape

Who: customers sitting in the salon.

One row per barber: photo, name, "Now: S-12" (or "Free" / "On break")
"Up next" list of 5 tokens with estimated times
Newly called token flashes burgundy with a chime
Text readable from 5 metres (very large font, high contrast)
Screen 7: Owner Settings (/admin) - tablet/laptop

Who: owner. Protected by a PIN.

Services list: name (EN/GU), minutes, price, on/off toggle, add/edit
Barbers on duty today (toggle per barber)
Queue switch: Open / Closed for online joining
Today's stats cards: customers served, average wait, no-shows
# Salon Queue Management System

**Live Website:** : https://salon-management-beta.vercel.app/

## About the Project

This is a salon queue management website that I developed as part of my Vibe Coding Lab project. The main idea is to make waiting at a salon easier for both customers and staff.

Customers can join the queue online, choose their services and preferred barber, and check how long they might have to wait. The receptionist and barbers can manage the queue, while the TV display shows the current and upcoming tokens.

## How to Use
You can open different sections of the website using these links:

- **Home:** `/`
- **Join Queue:** `/join`
- **My Status:** `/status/:id`
- **Reception:** `/reception`
- **Barber View:** `/barber/amit`
- **TV Display:** `/display`
- **Admin:** `/admin`

Replace `Amit` in the barber URL with the actual barber's name.

## Quick Guide

**For Customers:**
1. Open the website and click Join Queue.
2. Enter your name and phone number.
3. Select the services you want and choose a barber.
4. Confirm your entry and check your token status.

**For Reception:**
- Open the Reception page and enter the demo PIN.
- Add walk-in customers, call the next customer, and manage the waiting list.

**For Barbers:**
- Open your barber page using your name in the URL.
- Enter the demo PIN.
- Start and finish customer services and update your availability.

**For TV Display:**
- Open the Display page to see the current and upcoming tokens.

**For Admin:**
- Open the Admin page to manage services, barbers, opening hours and queue settings.

## Demo PIN

Reception / Barber / Admin: `1234`

## Technologies Used

- React
- Vite
- Tailwind CSS
- Firebase Firestore

# Goods Tracker

A Next.js application with Firebase backend to track goods from vehicles in and out of a location.

## Features

- **User Role**: Add records for goods entry/exit.
- **Admin Role**: View all records, filter by location/vehicle/driver, and edit records.
- **Secure Authentication**: Uses Firebase Authentication.
- **Real-time Updates**: Uses Firestore for real-time data syncing.
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS.

## Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd goods-tracker
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Firebase Configuration**:
    - Create a project in the [Firebase Console](https://console.firebase.google.com/).
    - Enable **Authentication** (Google Provider or Email/Password).
    - Enable **Cloud Firestore** and start in **Test Mode** (or update rules for production).
    - Get your web app configuration from the project settings.
    - Update `.env.local` with your configuration keys.

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Open in browser**:
    - Visit `http://localhost:3000`.

## Tech Stack

- **Frontend**: Next.js 14+, React, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Usage

- **Add Record**: Navigate to the home page, sign in, and fill out the form.
- **Admin Dashboard**: Navigate to `/admin` to view and manage records.

## License

MIT

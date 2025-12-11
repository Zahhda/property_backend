# Property Listing Backend

This is the backend API server for the Property Listing platform.

## Setup

1. Install dependencies:
```
npm install
```

2. Create a `.env` file in the root directory with the following content:
```
PORT=3001
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=mysql://username:password@localhost:3306/property_listing_db

# Email configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=no-reply@example.com
```

3. Set up the database:
```
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

4. Start the development server:
```
npm run dev
```

The API server will be available at http://localhost:3001 by default.

## Start in production mode

```
npm start
``` 
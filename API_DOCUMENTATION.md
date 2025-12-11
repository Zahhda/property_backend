# API Documentation

## Authentication

### Login
- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "user@example.com",
        "role": "user"
      }
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Invalid credentials",
    "code": "AUTH_INVALID_CREDENTIALS"
  }
  ```

### Register
- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "password123",
    "role": "user"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Email already exists",
    "code": "USER_EMAIL_EXISTS"
  }
  ```

### Forgot Password
- **URL:** `/api/auth/forgot-password`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "message": "Password reset instructions sent to your email"
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
  ```

### Reset Password
- **URL:** `/api/auth/reset-password`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "password": "newpassword123",
    "confirmPassword": "newpassword123"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "message": "Password has been reset successfully"
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Invalid or expired token",
    "code": "INVALID_RESET_TOKEN"
  }
  ```

## Roles

### Get All Roles
- **URL:** `/api/roles`
- **Method:** `GET`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 1,
        "name": "admin",
        "description": "Administrator"
      },
      {
        "id": 2,
        "name": "user",
        "description": "Regular User"
      }
    ]
  }
  ```

### Get Role by ID
- **URL:** `/api/roles/:id`
- **Method:** `GET`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "name": "admin",
      "description": "Administrator"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Role not found",
    "code": "ROLE_NOT_FOUND"
  }
  ```

### Create Role
- **URL:** `/api/roles`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "name": "manager",
    "description": "Manager Role"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 3,
      "name": "manager",
      "description": "Manager Role"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Role already exists",
    "code": "ROLE_ALREADY_EXISTS"
  }
  ```

### Update Role
- **URL:** `/api/roles/:id`
- **Method:** `PUT`
- **Payload:**
  ```json
  {
    "name": "senior_manager",
    "description": "Senior Manager Role"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 3,
      "name": "senior_manager",
      "description": "Senior Manager Role"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Role not found",
    "code": "ROLE_NOT_FOUND"
  }
  ```

### Delete Role
- **URL:** `/api/roles/:id`
- **Method:** `DELETE`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "message": "Role deleted successfully"
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Role not found",
    "code": "ROLE_NOT_FOUND"
  }
  ```

## Permissions

### Get All Permissions
- **URL:** `/api/permissions`
- **Method:** `GET`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 1,
        "name": "create_user",
        "description": "Create User Permission"
      },
      {
        "id": 2,
        "name": "delete_user",
        "description": "Delete User Permission"
      }
    ]
  }
  ```

### Get Permission by ID
- **URL:** `/api/permissions/:id`
- **Method:** `GET`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "name": "create_user",
      "description": "Create User Permission"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Permission not found",
    "code": "PERMISSION_NOT_FOUND"
  }
  ```

### Create Permission
- **URL:** `/api/permissions`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "name": "edit_user",
    "description": "Edit User Permission"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 3,
      "name": "edit_user",
      "description": "Edit User Permission"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Permission already exists",
    "code": "PERMISSION_ALREADY_EXISTS"
  }
  ```

### Update Permission
- **URL:** `/api/permissions/:id`
- **Method:** `PUT`
- **Payload:**
  ```json
  {
    "name": "update_user",
    "description": "Update User Permission"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 3,
      "name": "update_user",
      "description": "Update User Permission"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Permission not found",
    "code": "PERMISSION_NOT_FOUND"
  }
  ```

### Delete Permission
- **URL:** `/api/permissions/:id`
- **Method:** `DELETE`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "message": "Permission deleted successfully"
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Permission not found",
    "code": "PERMISSION_NOT_FOUND"
  }
  ```

## Users

### Get All Users
- **URL:** `/api/users`
- **Method:** `GET`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "user@example.com",
        "role": "user"
      }
    ]
  }
  ```

### Get User by ID
- **URL:** `/api/users/:id`
- **Method:** `GET`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
  ```

### Create User
- **URL:** `/api/users`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "role": "user"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 2,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Email already exists",
    "code": "USER_EMAIL_EXISTS"
  }
  ```

### Update User
- **URL:** `/api/users/:id`
- **Method:** `PUT`
- **Payload:**
  ```json
  {
    "name": "Jane Smith",
    "email": "jane.smith@example.com"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "role": "user"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
  ```

### Delete User
- **URL:** `/api/users/:id`
- **Method:** `DELETE`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "message": "User deleted successfully"
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
  ```

## Properties

### Get All Properties
- **URL:** `/api/properties`
- **Method:** `GET`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 1,
        "title": "Luxury Apartment",
        "description": "A beautiful apartment in the city",
        "price": 500000,
        "location": "New York",
        "bedrooms": 2,
        "bathrooms": 2,
        "area": 1200,
        "yearBuilt": 2020
      }
    ]
  }
  ```

### Get Property by ID
- **URL:** `/api/properties/:id`
- **Method:** `GET`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "title": "Luxury Apartment",
      "description": "A beautiful apartment in the city",
      "price": 500000,
      "location": "New York",
      "bedrooms": 2,
      "bathrooms": 2,
      "area": 1200,
      "yearBuilt": 2020
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Property not found",
    "code": "PROPERTY_NOT_FOUND"
  }
  ```

### Create Property
- **URL:** `/api/properties`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "title": "Beach House",
    "description": "A beautiful beach house",
    "price": 750000,
    "location": "Miami",
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 1500,
    "yearBuilt": 2019
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 2,
      "title": "Beach House",
      "description": "A beautiful beach house",
      "price": 750000,
      "location": "Miami",
      "bedrooms": 3,
      "bathrooms": 2,
      "area": 1500,
      "yearBuilt": 2019
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Missing required fields",
    "code": "PROPERTY_MISSING_FIELDS"
  }
  ```

### Update Property
- **URL:** `/api/properties/:id`
- **Method:** `PUT`
- **Payload:**
  ```json
  {
    "title": "Updated Beach House",
    "price": 800000
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 2,
      "title": "Updated Beach House",
      "description": "A beautiful beach house",
      "price": 800000,
      "location": "Miami",
      "bedrooms": 3,
      "bathrooms": 2,
      "area": 1500,
      "yearBuilt": 2019
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Property not found",
    "code": "PROPERTY_NOT_FOUND"
  }
  ```

### Delete Property
- **URL:** `/api/properties/:id`
- **Method:** `DELETE`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "message": "Property deleted successfully"
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Property not found",
    "code": "PROPERTY_NOT_FOUND"
  }
  ```

## Visits

### Schedule Visit
- **URL:** `/api/visits`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "propertyId": 1,
    "userId": 1,
    "visitDate": "2023-10-01T10:00:00Z",
    "notes": "Interested in viewing the property"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "propertyId": 1,
      "userId": 1,
      "visitDate": "2023-10-01T10:00:00Z",
      "notes": "Interested in viewing the property",
      "status": "scheduled"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Property not found",
    "code": "PROPERTY_NOT_FOUND"
  }
  ```

### Get Visit by ID
- **URL:** `/api/visits/:id`
- **Method:** `GET`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "propertyId": 1,
      "userId": 1,
      "visitDate": "2023-10-01T10:00:00Z",
      "notes": "Interested in viewing the property",
      "status": "scheduled"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Visit not found",
    "code": "VISIT_NOT_FOUND"
  }
  ```

### Update Visit
- **URL:** `/api/visits/:id`
- **Method:** `PUT`
- **Payload:**
  ```json
  {
    "visitDate": "2023-10-02T11:00:00Z",
    "notes": "Rescheduled visit"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "propertyId": 1,
      "userId": 1,
      "visitDate": "2023-10-02T11:00:00Z",
      "notes": "Rescheduled visit",
      "status": "scheduled"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Visit not found",
    "code": "VISIT_NOT_FOUND"
  }
  ```

### Delete Visit
- **URL:** `/api/visits/:id`
- **Method:** `DELETE`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "message": "Visit deleted successfully"
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Visit not found",
    "code": "VISIT_NOT_FOUND"
  }
  ```

## Feedback

### Submit Feedback
- **URL:** `/api/feedback`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "visitId": 1,
    "rating": 5,
    "comment": "Great property, loved the location!"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "visitId": 1,
      "rating": 5,
      "comment": "Great property, loved the location!"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Visit not found",
    "code": "VISIT_NOT_FOUND"
  }
  ```

### Get Feedback by ID
- **URL:** `/api/feedback/:id`
- **Method:** `GET`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "visitId": 1,
      "rating": 5,
      "comment": "Great property, loved the location!"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Feedback not found",
    "code": "FEEDBACK_NOT_FOUND"
  }
  ```

### Update Feedback
- **URL:** `/api/feedback/:id`
- **Method:** `PUT`
- **Payload:**
  ```json
  {
    "rating": 4,
    "comment": "Good property, but needs some repairs"
  }
  ```
- **Response (Success):**
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "visitId": 1,
      "rating": 4,
      "comment": "Good property, but needs some repairs"
    }
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Feedback not found",
    "code": "FEEDBACK_NOT_FOUND"
  }
  ```

### Delete Feedback
- **URL:** `/api/feedback/:id`
- **Method:** `DELETE`
- **Response (Success):**
  ```json
  {
    "status": "success",
    "message": "Feedback deleted successfully"
  }
  ```
- **Response (Error):**
  ```json
  {
    "status": "error",
    "message": "Feedback not found",
    "code": "FEEDBACK_NOT_FOUND"
  }
  ```

## Error Codes

- `AUTH_INVALID_CREDENTIALS`: Invalid login credentials
- `USER_EMAIL_EXISTS`: Email already exists
- `USER_NOT_FOUND`: User not found
- `ROLE_NOT_FOUND`: Role not found
- `ROLE_ALREADY_EXISTS`: Role already exists
- `PERMISSION_NOT_FOUND`: Permission not found
- `PERMISSION_ALREADY_EXISTS`: Permission already exists
- `PROPERTY_NOT_FOUND`: Property not found
- `PROPERTY_MISSING_FIELDS`: Missing required fields for property
- `VISIT_NOT_FOUND`: Visit not found
- `FEEDBACK_NOT_FOUND`: Feedback not found

## Authentication

All endpoints except `/api/auth/login` and `/api/auth/register` require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

## Rate Limiting

- 100 requests per 15 minutes per IP address in development
- 50 requests per 15 minutes per IP address in production

## CORS

- Development: `http://localhost:3000`, `http://localhost:8080`
- Production: `https://yourdomain.com`

## File Upload

- Maximum file size: 5MB (development), 10MB (production)
- Allowed file types: `image/jpeg`, `image/png`, `image/gif`
- Upload directory: `uploads/dev` (development), `uploads/prod` (production)

## Logging

- Development: Debug level, dev format
- Production: Error level, combined format

## Cache

- Development: 5 minutes TTL
- Production: 10 minutes TTL 
import { PassportSerializer } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";


// This class is responsible for serializing and deserializing user information for session management in Passport. The serializeUser method takes a user object and extracts specific properties (firstName, lastName, email) to store in the session, while the deserializeUser method retrieves the stored user information from the session and makes it available for use in subsequent requests.
@Injectable()
export class SessionSerializer extends PassportSerializer {
    serializeUser(user: any, done: (err: Error | null, user: any) => void): any {
        done(null, {
            _id: user._id?.toString ? user._id.toString() : user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        });
    }


    // This method is called by Passport to retrieve the user information from the session. It takes the stored user information (payload) and passes it to the done callback function, making it available for use in subsequent requests.
    deserializeUser(payload: any, done: (err: Error | null, payload: any) => void): any {
        done(null, payload);
    }
}

import { PassportSerializer } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../../user/schemas/user.schema";


// This class is responsible for serializing and deserializing user information for session management in Passport. The serializeUser method takes a user object and extracts specific properties (firstName, lastName, email) to store in the session, while the deserializeUser method retrieves the stored user information from the session and makes it available for use in subsequent requests.
@Injectable()
export class SessionSerializer extends PassportSerializer {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>
    ) {
        super();
    }

    serializeUser(user: any, done: (err: Error | null, user: any) => void): any {
        done(null, {
            _id: user._id?.toString ? user._id.toString() : user._id
        });
    }


    // This method is called by Passport to retrieve the user information from the session. It takes the stored user information (payload), queries the database to verify the user still exists, and then passes the payload to the done callback function.
    async deserializeUser(payload: any, done: (err: Error | null, payload: any) => void): Promise<any> {
        try {
            // VULN-11/12 FIX: Fetch fresh user from DB, exclude sensitive fields
            const user = await this.userModel.findById(payload._id)
                .select('-password -__v -resetPasswordTokenHash -verifyEmailTokenHash')
                .lean()
                .exec();
            if (!user) {
                return done(new Error('Session invalid: user not found'), null);
            }
            done(null, user);
        } catch (err) {
            done(err instanceof Error ? err : new Error(String(err)), null);
        }
    }
}

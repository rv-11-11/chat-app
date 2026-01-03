import UserModel from "../models/user.model";
import { NotFoundException, UnauthorizedException } from "../services/utils/app-error";
import {
  LoginSchemaType,
  RegisterSchemaType,
  GoogleLoginSchemaType,
} from "../validators/auth.validator";
import { claimInvitesByEmailService } from "./invite.service";

export const registerService = async (body: RegisterSchemaType) => {
  const { email } = body;
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) throw new UnauthorizedException("User already exist");
  const newUser = new UserModel({
    name: body.name,
    email: body.email,
    password: body.password,
    avatar: body.avatar,
  });
  await newUser.save();
  
  // Claim any pending invites
  await claimInvitesByEmailService(newUser.email!, newUser._id as string);
  
  return newUser;
};

export const loginService = async (body: LoginSchemaType) => {
  const { email, password } = body;

  const user = await UserModel.findOne({ email });
  if (!user) throw new NotFoundException("Email or Password not found");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid)
    throw new UnauthorizedException("Invaild email or password");

  return user;
};

export const googleLoginService = async (body: GoogleLoginSchemaType) => {
  const { email, name, googleId, avatar } = body;
  let user = await UserModel.findOne({ email });
  
  if (!user) {
    user = new UserModel({
      name,
      email,
      password: googleId, // Use googleId as password (hashed by pre-save)
      avatar,
    });
    await user.save();
    
    // Claim any pending invites
    await claimInvitesByEmailService(user.email!, user._id as string);
  }
  
  return user;
};

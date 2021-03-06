import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserAccountStatus } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   * @params userDto - email, phoneNumber, password
   * @returns {Promise<User>} - created user
   */
  async create(userDto: CreateUserDto): Promise<User> {
    const { email, phoneNumber } = userDto;
    const userEmail = await this.userRepository.findOne({ email });

    // Email already registered
    if (userEmail) {
      throw new ConflictException('Email is already registered');
    }
    // Phone number already registered
    const userPhoneNumber = await this.userRepository.findOne({ phoneNumber });
    if (userPhoneNumber) {
      throw new ConflictException('Phone Number is already registered');
    }
    const newUser = this.userRepository.create(userDto);
    await this.userRepository.save(newUser);
    return newUser;
  }

  /**
   * Return all Users
   * @returns {Promise<User[]>}
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * Find a user by email
   * @param email
   * @returns {Promise<User>} - User
   */
  async findOne(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Update user details
   * @params email and UpdateUserDto
   * @returns {Promise<User>} - updated user
   */
  async update(email: string, userDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Before updating the user, check if the email is already registered
    const userEmail = await this.userRepository.findOne({
      email: userDto.email,
    });
    if (userEmail && userEmail.id !== user.id) {
      throw new ConflictException('Email is already registered');
    }

    // Before updating the user, check if the phone number is already registered
    const userPhoneNumber = await this.userRepository.findOne({
      phoneNumber: userDto.phoneNumber,
    });
    if (userPhoneNumber && userPhoneNumber.id !== user.id) {
      throw new ConflictException('Phone Number is already registered');
    }

    // Prevent updating the user password - only the user can update his password
    // This also solves the bycrypt issue/Typeorm update function issue
    delete userDto.password;
    await this.userRepository.update({ email }, userDto);
    return await this.userRepository.findOne(user.id);
  }

  /**
   * Update user password
   * @param email
   * @param newPassword
   * @returns {Promise<User | any>} - Updated user
   */
  async updatePassword(
    email: string,
    newPassword: string,
  ): Promise<User | any> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }
    // Update password in the database - don't use update method of typeorm(din't work with bcrypt)
    user.password = newPassword;
    await this.userRepository.save(user);
    return await this.userRepository.findOne(user.id);
  }

  /**
   * Mark email as confirmed
   * @param email
   * @returns {Promise<User>} - Updated user
   */
  async markEmailAsConfirmed(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isEmailConfirmed = true;
    // update user status to verified
    user.status = UserAccountStatus.VERIFIED;
    await this.userRepository.save(user);
    // return updated user
    return await this.userRepository.findOne(user.id);
  }

  /**
   * Mark email as confirmed
   * @param email
   * @returns {Promise<User>} - Updated user
   */
  async markPhoneNumberConfirmed(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isPhoneNumberConfirmed = true;
    // update user status to verified
    user.status = UserAccountStatus.VERIFIED;
    return await this.userRepository.save(user);
  }

  /**
   * Delete a user
   * @param email - user email
   * @returns {Promise<any>} - user deleted message
   */
  async remove(email: string): Promise<any> {
    const deletedUser = await this.userRepository.delete({ email });
    // User doesn't exist
    if (!deletedUser.affected) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted' };
  }
  /**
   * Gets all user private files
   * @param userId
   * @returns {Promise<any>}
   */
  async getAllPrivateFiles(userId: number): Promise<any> {
    const userWithFiles = await this.userRepository.findOne(
      { id: userId },
      { relations: ['files'] },
    );
    if (userWithFiles) {
      return userWithFiles.files;
    }
    throw new NotFoundException(`User with id ${userId} not found`);
  }
}

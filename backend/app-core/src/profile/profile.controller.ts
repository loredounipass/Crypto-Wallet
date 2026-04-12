import { Controller, UseGuards, Get, Post, Body, UseInterceptors, UploadedFile, Param, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { CurrentUser } from 'src/guard/auth/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @UseGuards(AuthenticatedGuard)
  @Get('me')
  async getMyProfile(@CurrentUser() user: any) {
    return this.service.getByOwner(user._id.toString());
  }

  @Get(':id')
  async getProfileById(@Param('id') id: string) {
    return this.service.getPublicById(id);
  }

  @UseGuards(AuthenticatedGuard)
  @Post()
  async upsert(@Body() dto: UpdateProfileDto, @CurrentUser() user: any) {
    return this.service.upsert(user._id.toString(), dto);
  }

  @UseGuards(AuthenticatedGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @Post('upload/profile-photo')
  async uploadProfilePhoto(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.service.uploadImage(user._id.toString(), file, 'profile');
  }

  // Public: list photos & videos posted by profile owner (for profile media tab)
  @Get(':id/posts')
  async getPostsByProfile(@Param('id') id: string, @Query('limit') limit?: string) {
    const l = limit ? parseInt(limit, 10) : 50;
    return this.service.getPostsForProfile(id, l);
  }

}

export default {};

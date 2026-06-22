import { Body, Controller, Get, Post, UseGuards, Param, Delete, Put, UseInterceptors, UploadedFile, BadRequestException, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FeedAndMultimediaService } from './feed-and-multimedia.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { EmailThrottlerGuard } from 'src/guard/auth/email-throttler.guard';


/** Lightweight interface matching the Multer file shape used by NestJS. */
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

// This controller handles feed posts and comments, including multimedia uploads for posts.
@Controller('feed')
export class FeedAndMultimediaController {
  constructor(private readonly service: FeedAndMultimediaService) {}


  // Post creation with optional file upload. If a file is included, it will be processed and associated with the post.
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Post()
  async create(@Body() dto: CreatePostDto, @Request() req) {
    return this.service.createPost(dto, req.user._id.toString());
  }


  // Separate endpoint for creating a post with a file upload. Delegate validation and processing to the service.
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  // Increase fileSize limit to support longer videos (approx 250MB)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 250 * 1024 * 1024 } }))
  @Post('upload')
  async createWithFile(@UploadedFile() file: MulterFile, @Body() body: any, @Request() req) {
    // All validation/processing is handled inside the service
    return this.service.createPostWithFile(file, body, req.user._id.toString());
  }

  
  // Get feed and individual posts 
  @UseGuards(AuthenticatedGuard)
  @Get()
  async getFeed() {
    return this.service.getFeed();
  }


  // Video-only feed: returns only posts that contain video multimedia.
  // Must be declared before :id route to avoid being caught by it.
  @UseGuards(AuthenticatedGuard)
  @Get('videos')
  async getVideoFeed() {
    return this.service.getVideoFeed();
  }


  // Get a single post by ID, including its comments and multimedia content if available.
  @UseGuards(AuthenticatedGuard)
  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.service.getPostById(id);
  }


  // Post update/delete
  @UseGuards(AuthenticatedGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.service.updatePost(id, body, req.user._id.toString());
  }


  // Only the post author can delete the post, which also deletes all associated comments and multimedia content.
  @UseGuards(AuthenticatedGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.service.deletePost(id, req.user._id.toString());
  }


  // Comment creation, retrieval, deletion, and liking/unliking. Comments can be nested (replies) and are associated with a specific post.
  @UseGuards(AuthenticatedGuard, EmailThrottlerGuard)
  @Post(':id/comments')
  async addComment(@Param('id') id: string, @Body() body: any, @Request() req) {
    const dto: CreateCommentDto = {
      content: body.content,
      postId: id,
      authorId: req.user._id.toString(),
      parentId: body.parentId,
    } as CreateCommentDto;
    return this.service.addComment(dto, req.user._id.toString());
  }


  // Get all comments for a specific post, including nested replies. Comments are returned in a hierarchical structure to reflect the parent-child relationships.
  @UseGuards(AuthenticatedGuard)
  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.service.getCommentsForPost(id);
  }


  // Only the comment author can delete the comment. Deleting a comment also deletes all its nested replies.
  @UseGuards(AuthenticatedGuard)
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Request() req) {
    return this.service.deleteComment(commentId, req.user._id.toString());
  }


  // Liking and unliking comments and posts. Users can like both posts and comments, and these endpoints handle the creation and removal of likes. The service ensures that users can only like a post or comment once and can unlike it if they change their mind.
  @UseGuards(AuthenticatedGuard)
  @Post('comments/:commentId/likes')
  async likeComment(@Param('commentId') commentId: string, @Request() req) {
    return this.service.likeComment(commentId, req.user._id.toString());
  }


  // Unliking a comment allows users to remove their like from a comment they previously liked. This endpoint ensures that the like is removed correctly and that the user can only unlike comments they have liked.
  @UseGuards(AuthenticatedGuard)
  @Delete('comments/:commentId/likes')
  async unlikeComment(@Param('commentId') commentId: string, @Request() req) {
    return this.service.unlikeComment(commentId, req.user._id.toString());
  }


// Liking and unliking posts. Similar to comments, users can like and unlike posts, and these endpoints manage the likes for posts. The service ensures that users can only like a post once and can unlike it if they change their mind.
  @UseGuards(AuthenticatedGuard)
  @Post(':id/likes')
  async addLike(@Param('id') id: string, @Request() req) {
    return this.service.likePost(id, req.user._id.toString());
  }


  // Unliking a post allows users to remove their like from a post they previously liked. This endpoint ensures that the like is removed correctly and that the user can only unlike posts they have liked.
  @UseGuards(AuthenticatedGuard)
  @Delete(':id/likes')
  async removeLike(@Param('id') id: string, @Request() req) {
    return this.service.unlikePost(id, req.user._id.toString());
  }


  // Incrementing post views. This endpoint is called when a user views a post, and it increments the view count for that post. The service ensures that the same user cannot increment the view count multiple times in a short period to prevent abuse.
  @UseGuards(AuthenticatedGuard)
  @Post(':id/views')
  async addView(@Param('id') id: string, @Request() req) {
    // Ensure session structure for viewed posts
    const sess: any = req.session || {};
    sess.viewedPosts = sess.viewedPosts || {};

    // If this post was already viewed in this session, return current post without incrementing
    if (sess.viewedPosts[id]) {
      return this.service.getPostById(id);
    }

    // Mark as viewed in this session and persist via express-session
    try {
      sess.viewedPosts[id] = Date.now();
      req.session = sess;
    } catch (_) {}
    return this.service.incrementView(id, req.user._id.toString());
  }


  
  // Increment share count on a post. Called when a user shares a post.
  @UseGuards(AuthenticatedGuard)
  @Post(':id/shares')
  async addShare(@Param('id') id: string, @Request() req) {
    return this.service.incrementShare(id, req.user._id.toString());
  }
}

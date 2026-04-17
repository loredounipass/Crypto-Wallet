import { Controller, Post, Body, Get, Param, Request, UseGuards, Patch } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/provider.dto';
import { CreateChatDto } from './dto/chat.dto';
import { CreateMessageDto } from './dto/message.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { Provider } from './schemas/provider.schema';
import { Chat } from './schemas/chat-schema/chat.schema';
import { AuthenticatedGuard } from '../guard/auth/authenticated.guard';

@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @UseGuards(AuthenticatedGuard)
  @Post('create')
  createProvider(
    @Request() req,
    @Body() createProviderDto: CreateProviderDto
  ): Promise<Provider> {
    createProviderDto.email = req.user.email;
    return this.providerService.createProvider(createProviderDto);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('findByEMail/:email')
  findProviderByEmail(@Param('email') email: string): Promise<Provider> {
    return this.providerService.findProviderByEmail(email);
  }

@UseGuards(AuthenticatedGuard)
@Get('allProviders')
findAllProviders(): Promise<Provider[]> {
  return this.providerService.findAllProviders();
}


  @UseGuards(AuthenticatedGuard)
  @Post('createChat')
  createChat(
    @Request() req,
    @Body() createChatDto: CreateChatDto
  ): Promise<Chat> {
    return this.providerService.createChat(createChatDto);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('sendMessageAsUser')
  sendMessageAsUser(
    @Request() req,
    @Body() createMessageDto: CreateMessageDto
  ): Promise<Chat> {
    createMessageDto.sender = req.user.email;
    return this.providerService.sendMessageAsUser(createMessageDto);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('sendMessageAsProvider')
  sendMessageAsProvider(
    @Request() req,
    @Body() createMessageDto: CreateMessageDto
  ): Promise<Chat> {
    createMessageDto.sender = req.user.email;
    return this.providerService.sendMessageAsProvider(createMessageDto);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('getMessages/:chatId')
  getMessages(@Param('chatId') chatId: string): Promise<any> {
    return this.providerService.getMessages(chatId);
  }

  @UseGuards(AuthenticatedGuard)
  @Patch('update')
  updateProvider(
    @Request() req,
    @Body() updateProviderDto: UpdateProviderDto
  ): Promise<Provider> {
    return this.providerService.updateProvider(req.user.email, updateProviderDto);
  }
}

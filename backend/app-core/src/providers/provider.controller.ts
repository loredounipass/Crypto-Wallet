import { Controller, Post, Body, Get, Param, Request, UseGuards, Patch, Delete } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/provider.dto';
import { CreateChatDto } from './dto/chat.dto';
import { CreateMessageDto } from './dto/message.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { AddPaymentMethodDto, UpdateDestinationWalletDto, ToggleDestinationWalletDto } from './dto/provider-settings.dto';
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
  @Post('terms/accept')
  async acceptTerms(@Request() req): Promise<any> {
    const terms = await this.providerService.acceptTerms(req.user.email);
    return { accepted: terms.accepted };
  }

  @UseGuards(AuthenticatedGuard)
  @Get('terms/check')
  async checkTerms(@Request() req): Promise<{ accepted: boolean }> {
    const accepted = await this.providerService.checkTerms(req.user.email);
    return { accepted };
  }

  @UseGuards(AuthenticatedGuard)
  @Get('findByEMail/:email')
  findProviderByEmail(@Param('email') email: string): Promise<Provider> {
    return this.providerService.findProviderByEmail(email);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('allProviders')
  findAllProviders(@Request() req): Promise<Provider[]> {
    return this.providerService.findAllProviders(req.user.email);
  }

  @UseGuards(AuthenticatedGuard)
  @Patch('update')
  updateProvider(
    @Request() req,
    @Body() updateProviderDto: UpdateProviderDto
  ): Promise<Provider> {
    return this.providerService.updateProvider(req.user.email, updateProviderDto);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('settings')
  getSettings(@Request() req): Promise<Provider> {
    return this.providerService.getProviderSettings(req.user.email);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('settings/payment-methods')
  addPaymentMethod(
    @Request() req,
    @Body() dto: AddPaymentMethodDto
  ): Promise<Provider> {
    return this.providerService.addPaymentMethod(req.user.email, dto);
  }

  @UseGuards(AuthenticatedGuard)
  @Delete('settings/payment-methods/:method')
  deletePaymentMethod(
    @Request() req,
    @Param('method') method: string
  ): Promise<Provider> {
    return this.providerService.deletePaymentMethod(req.user.email, method);
  }

  @UseGuards(AuthenticatedGuard)
  @Patch('settings/destination-wallet')
  updateDestinationWallet(
    @Request() req,
    @Body() dto: UpdateDestinationWalletDto
  ): Promise<Provider> {
    return this.providerService.updateDestinationWallet(req.user.email, dto);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('settings/destination-wallets/toggle')
  toggleDestinationWallet(
    @Request() req,
    @Body() dto: ToggleDestinationWalletDto
  ): Promise<Provider> {
    return this.providerService.toggleDestinationWallet(req.user.email, dto);
  }
}

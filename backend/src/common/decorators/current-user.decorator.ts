import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CurrentUserPayload {
  userId: string;
  username: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof CurrentUserPayload | undefined,
    ctx: ExecutionContext,
  ): CurrentUserPayload | string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = 'user' in request && request.user;

    if (!user) {
      return undefined;
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);

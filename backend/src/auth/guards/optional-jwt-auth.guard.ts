import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt'){
    handleRequest(err: any, user: any) {
        return user || null;
    }

    canActivate(context: ExecutionContext) {
        return super.canActivate(context) as Promise<boolean>;
    }
}
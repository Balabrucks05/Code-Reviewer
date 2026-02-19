import { Module } from '@nestjs/common';
import { SecurityAnalyzerService } from './services/security-analyzer.service';
import { ReentrancyRule } from './rules/reentrancy.rule';
import { AccessControlRule } from './rules/access-control.rule';
import { UncheckedCallsRule } from './rules/unchecked-calls.rule';
import { UpgradeabilityRule } from './rules/upgradeability.rule';
import { StorageCollisionRule } from './rules/storage-collision.rule';

@Module({
    providers: [
        SecurityAnalyzerService,
        ReentrancyRule,
        AccessControlRule,
        UncheckedCallsRule,
        UpgradeabilityRule,
        StorageCollisionRule,
    ],
    exports: [SecurityAnalyzerService],
})
export class SecurityModule { }

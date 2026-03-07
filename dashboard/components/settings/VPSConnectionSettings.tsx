'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOpenClawStore } from '@/store/useOpenClawStore';
import { useAgentZeroStore } from '@/store/useAgentZeroStore';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

type ConnectionTestStatus = 'idle' | 'testing' | 'success' | 'error';

export function VPSConnectionSettings() {
    // OpenClaw state
    const openClawWsUrl = useOpenClawStore((s) => s.wsUrl);
    const openClawHttpUrl = useOpenClawStore((s) => s.httpUrl);
    const openClawConnected = useOpenClawStore((s) => s.isConnected);
    const openClawStatus = useOpenClawStore((s) => s.connectionStatus);
    const openClawIsRemote = useOpenClawStore((s) => s.isRemote);
    const setOpenClawEndpoints = useOpenClawStore((s) => s.setEndpoints);

    // Agent Zero state
    const agentZeroBaseUrl = useAgentZeroStore((s) => s.vpsBaseUrl);
    const agentZeroConnected = useAgentZeroStore((s) => s.vpsConnected);
    const agentZeroStatus = useAgentZeroStore((s) => s.status);
    const agentZeroIsRemote = useAgentZeroStore((s) => s.isRemote);
    const setAgentZeroBaseUrl = useAgentZeroStore((s) => s.setVpsBaseUrl);
    const checkAgentZeroHealth = useAgentZeroStore((s) => s.checkVpsHealth);

    // Local form state
    const [ocWsUrl, setOcWsUrl] = useState(openClawWsUrl);
    const [ocHttpUrl, setOcHttpUrl] = useState(openClawHttpUrl);
    const [a0BaseUrl, setA0BaseUrl] = useState(agentZeroBaseUrl);

    // Test status
    const [ocTestStatus, setOcTestStatus] = useState<ConnectionTestStatus>('idle');
    const [a0TestStatus, setA0TestStatus] = useState<ConnectionTestStatus>('idle');

    // Test OpenClaw connection
    const testOpenClawConnection = useCallback(async () => {
        setOcTestStatus('testing');
        try {
            // Test via the proxy route
            const response = await fetch(`/api/openclaw-proxy?path=/health`);
            if (response.ok) {
                setOcTestStatus('success');
            } else {
                setOcTestStatus('error');
            }
        } catch {
            setOcTestStatus('error');
        }
    }, []);

    // Test Agent Zero connection
    const testAgentZeroConnection = useCallback(async () => {
        setA0TestStatus('testing');
        try {
            const isOnline = await checkAgentZeroHealth();
            setA0TestStatus(isOnline ? 'success' : 'error');
        } catch {
            setA0TestStatus('error');
        }
    }, [checkAgentZeroHealth]);

    // Save OpenClaw settings
    const saveOpenClawSettings = useCallback(() => {
        setOpenClawEndpoints(ocWsUrl, ocHttpUrl);
    }, [ocWsUrl, ocHttpUrl, setOpenClawEndpoints]);

    // Save Agent Zero settings
    const saveAgentZeroSettings = useCallback(() => {
        setAgentZeroBaseUrl(a0BaseUrl);
    }, [a0BaseUrl, setAgentZeroBaseUrl]);

    // Status badge helper
    const StatusBadge = ({ connected, status, testStatus }: {
        connected: boolean;
        status: string;
        testStatus: ConnectionTestStatus;
    }) => {
        if (testStatus === 'testing') {
            return (
                <Badge variant="outline" className="gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Testing...
                </Badge>
            );
        }
        if (testStatus === 'success') {
            return (
                <Badge className="gap-1 bg-lime-500/20 text-lime-400 border-lime-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                </Badge>
            );
        }
        if (testStatus === 'error') {
            return (
                <Badge className="gap-1 bg-red-500/20 text-red-400 border-red-500/30">
                    <XCircle className="w-3 h-3" />
                    Failed
                </Badge>
            );
        }
        if (connected) {
            return (
                <Badge className="gap-1 bg-lime-500/20 text-lime-400 border-lime-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Online
                </Badge>
            );
        }
        if (status === 'connecting' || status === 'authenticating') {
            return (
                <Badge variant="outline" className="gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Connecting
                </Badge>
            );
        }
        return (
            <Badge className="gap-1 bg-red-500/20 text-red-400 border-red-500/30">
                <XCircle className="w-3 h-3" />
                Offline
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* OpenClaw VPS Section */}
            <Card className="border-border/50 bg-card/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">OpenClaw Gateway</CardTitle>
                            <CardDescription>
                                WebSocket connection to the OpenClaw agent orchestration gateway
                            </CardDescription>
                        </div>
                        <StatusBadge
                            connected={openClawConnected}
                            status={openClawStatus}
                            testStatus={ocTestStatus}
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {openClawIsRemote && (
                        <div className="flex items-center gap-2 text-sm text-amber-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Connected to remote VPS</span>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                WebSocket URL
                            </label>
                            <Input
                                value={ocWsUrl}
                                onChange={(e) => setOcWsUrl(e.target.value)}
                                placeholder="ws://76.13.193.227:63966"
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                HTTP URL
                            </label>
                            <Input
                                value={ocHttpUrl}
                                onChange={(e) => setOcHttpUrl(e.target.value)}
                                placeholder="http://76.13.193.227:63966"
                                className="font-mono text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={testOpenClawConnection}
                            disabled={ocTestStatus === 'testing'}
                        >
                            {ocTestStatus === 'testing' ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Test Connection
                        </Button>
                        <Button
                            size="sm"
                            onClick={saveOpenClawSettings}
                            disabled={ocWsUrl === openClawWsUrl && ocHttpUrl === openClawHttpUrl}
                        >
                            Save Changes
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground pt-2">
                        The auth token is configured via <code className="text-xs bg-muted px-1 py-0.5 rounded">OPENCLAW_AUTH_TOKEN</code> environment variable.
                    </p>
                </CardContent>
            </Card>

            <Separator />

            {/* Agent Zero VPS Section */}
            <Card className="border-border/50 bg-card/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Agent Zero</CardTitle>
                            <CardDescription>
                                REST API connection to the Agent Zero autonomous agent
                            </CardDescription>
                        </div>
                        <StatusBadge
                            connected={agentZeroConnected}
                            status={agentZeroStatus}
                            testStatus={a0TestStatus}
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {agentZeroIsRemote && (
                        <div className="flex items-center gap-2 text-sm text-amber-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Connected to remote VPS</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            Base URL
                        </label>
                        <Input
                            value={a0BaseUrl}
                            onChange={(e) => setA0BaseUrl(e.target.value)}
                            placeholder="http://76.13.193.227:5081"
                            className="font-mono text-sm"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={testAgentZeroConnection}
                            disabled={a0TestStatus === 'testing'}
                        >
                            {a0TestStatus === 'testing' ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            Test Connection
                        </Button>
                        <Button
                            size="sm"
                            onClick={saveAgentZeroSettings}
                            disabled={a0BaseUrl === agentZeroBaseUrl}
                        >
                            Save Changes
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground pt-2">
                        The API key is configured via <code className="text-xs bg-muted px-1 py-0.5 rounded">AGENT_ZERO_API_KEY</code> environment variable.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

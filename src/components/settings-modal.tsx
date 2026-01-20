import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getTranslations, Locale } from '@/lib/i18n';
import { Settings2, RotateCcw, Monitor, User, Globe, Mail, Moon, Sun } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    locale: Locale;
    fontSize: number;
    setFontSize: (size: number) => void;
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
}

export default function SettingsModal({
    isOpen,
    onClose,
    locale,
    fontSize,
    setFontSize,
    darkMode,
    setDarkMode
}: SettingsModalProps) {
    const t = getTranslations(locale);
    const isRTL = locale === 'ar';

    const handleReset = () => {
        setFontSize(1.0); // Reset to standard 1.0rem (100%)
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg rounded-2xl overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
                <DialogHeader className={isRTL ? 'text-right' : 'text-left'}>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Settings2 className="w-5 h-5 text-primary" />
                        {t.settings}
                    </DialogTitle>
                    <DialogDescription>
                        {t.adjustFontSize} {t.aboutApp}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">

                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-full border shadow-sm">
                                {darkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-orange-400" />}
                            </div>
                            <div className="space-y-0.5">
                                <div className="font-semibold text-sm">Appearance</div>
                                <div className="text-xs text-muted-foreground">{darkMode ? 'Dark Mode' : 'Light Mode'}</div>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)} className="rounded-xl h-8">
                            {darkMode ? 'Switch to Light' : 'Switch to Dark'}
                        </Button>
                    </div>


                    {/* Font Size Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-muted-foreground" />
                                {t.adjustFontSize}
                            </h3>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-xl space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">A</span>
                                <input
                                    type="range"
                                    min="0.9"
                                    max="1.5"
                                    step="0.05"
                                    className="flex-1 accent-primary h-2 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseFloat(e.target.value))}
                                />
                                <span className="text-xl font-bold">A</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Small</span>
                                <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 px-2 text-xs hover:text-primary">
                                    <RotateCcw className="w-3 h-3 mr-1" /> {t.reset}
                                </Button>
                                <span>Large</span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* About Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {t.aboutApp}
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col justify-between h-20">
                                <div className="text-xs text-muted-foreground mb-1">{t.developedBy}</div>
                                <div className="font-semibold flex items-center gap-2 text-sm">
                                    <Globe className="w-3 h-3 text-primary shrink-0" />
                                    Constant Labs
                                </div>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col justify-between h-20">
                                <div className="text-xs text-muted-foreground mb-1">{t.projectLead}</div>
                                <div className="font-semibold text-sm">Ahmad</div>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col justify-between h-20">
                                <div className="text-xs text-muted-foreground mb-1">{t.version}</div>
                                <div className="font-semibold font-mono text-xs">v1.2.0 (Beta)</div>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col justify-between h-20">
                                <div className="text-xs text-muted-foreground mb-1">{t.contact}</div>
                                <div className="font-semibold flex items-center gap-2 text-xs truncate">
                                    <Mail className="w-3 h-3 text-primary shrink-0" />
                                    <a href="mailto:akhmad6093@gmail.com" className="hover:underline truncate">akhmad6093@gmail.com</a>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


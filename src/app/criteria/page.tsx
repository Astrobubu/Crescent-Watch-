'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Eye, Info, Moon, Sun, ExternalLink, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function CriteriaPage() {
    return (
        <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Navigation & Header */}
                <div className="space-y-4">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            Crescent Visibility Criteria
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl leading-relaxed">
                            A comparative analysis of the mathematical models and empirical sighting records used to predict the first visibility of the new lunar crescent.
                        </p>
                    </div>
                </div>

                {/* 1. The Geometry Diagram */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Info className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold tracking-tight">The Geometry of Visibility</h2>
                    </div>

                    <Card className="bg-card border-border overflow-hidden shadow-lg">
                        <CardContent className="p-0 grid lg:grid-cols-5">
                            {/* Image Container - REMOVED BLACK BOX, Clean */}
                            <div className="lg:col-span-3 relative flex items-center justify-center p-4 min-h-[400px]">
                                <div className="relative w-full h-full max-w-[500px] aspect-square rounded-2xl overflow-hidden">
                                    {/* Using standard img tag for robust loading without sizing issues */}
                                    <img
                                        src="/lunar_geometry.png"
                                        alt="Lunar Visibility Geometry Diagram"
                                        className="w-full h-full object-contain mix-blend-screen dark:mix-blend-normal"
                                    />
                                </div>
                            </div>

                            {/* Explanation Panel */}
                            <div className="lg:col-span-2 p-6 md:p-8 space-y-8 flex flex-col justify-center bg-muted/5 border-l border-border">
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2 text-blue-500"><Eye className="w-5 h-5" /> ARCV (Arc of Vision)</h3>
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        The geocentric altitude difference between the center of the Sun and the center of the Moon.
                                        <br /><span className="text-xs text-muted-foreground mt-1 block">Crucial for Yallop and Odeh. A higher ARCV means the moon is in a darker sky.</span>
                                    </p>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2 text-primary"><Moon className="w-5 h-5" /> Crescent Width (W)</h3>
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        The angular width of the illuminated limb. Directly related to topocentric <strong>Elongation</strong> (angular separation).
                                        <br /><span className="text-xs text-muted-foreground mt-1 block">Thicker crescents have higher surface brightness contrast.</span>
                                    </p>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2 text-orange-500"><Sun className="w-5 h-5" /> Sun Depression</h3>
                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                        The angle of the Sun below the horizon. Visibility is best checked at the "Best Time" (approx. 4/9ths of the lag time after sunset).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* 2. Historical Background */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 border-b pb-4">
                        <Clock className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold tracking-tight">Historical Evolution</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-muted/30">
                            <CardHeader>
                                <CardTitle className="text-lg">Danjon Limit (~1930s)</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground leading-relaxed">
                                André Danjon proposed that if the elongation is less than <strong>7°</strong>, the crescent is invisible.
                                Shadows from lunar mountains break the crescent's continuity, rendering the illuminated arc length effectively zero.
                                Modern analysis refines this to approx <strong>6.4°</strong> for optical aid and <strong>7.7°</strong> for naked eye.
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                            <CardHeader>
                                <CardTitle className="text-lg">Babylonian & Medieval</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground leading-relaxed">
                                Early criteria relied on simple "Rule of Thumb" thresholds:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li><strong>Age:</strong> Moon must be &gt; 24 hours old.</li>
                                    <li><strong>Lag:</strong> Moonset must be &gt; 48 minutes after Sunset.</li>
                                </ul>
                                These were often correct but failed in edge cases (e.g., high-latitude summers) as they ignored the combined geometry of brightness and contrast.
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* 3. Detailed Criteria Analysis - FULLY EXPANDED */}
                <section className="space-y-8">
                    <div className="flex items-center gap-2 border-b pb-4">
                        <BookOpen className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold tracking-tight">Modern Criteria Deep Dive</h2>
                    </div>

                    <div className="grid gap-8">

                        {/* YALLOP */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-foreground">Yallop's Criterion (1997)</h3>
                                <Badge variant="secondary" className="text-sm">Empirical Polynomial</Badge>
                            </div>
                            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6 md:p-8 space-y-6">
                                    <p className="text-base text-foreground/90 leading-relaxed">
                                        B.D. Yallop (HM Nautical Almanac Office) developed this standard method by fitting a curve to 295 sighting records.
                                        It calculates a <strong>q-value</strong> based on the Moon's geocentric altitude difference (ARCV) and semidiameter-corrected width (W). The calculation is performed at the "best time" (4/9ths of local lag).
                                    </p>

                                    <div className="bg-muted/30 p-6 rounded-xl border border-border space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Calculator className="w-4 h-4 text-primary" /> The q-value Equation</div>
                                        <div className="font-mono text-sm md:text-base bg-background p-4 rounded-lg border shadow-sm overflow-x-auto whitespace-nowrap">
                                            q = (ARCV - (11.8371 - 6.3226W + 0.7319W² - 0.1018W³)) / 10
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4 text-sm pt-2">
                                            <div className="space-y-1">
                                                <p className="font-semibold">Classification Zones:</p>
                                                <ul className="space-y-1 text-muted-foreground">
                                                    <li className="flex gap-2"><span className="w-16 font-mono font-medium text-foreground">Zone A:</span> q &gt; +0.216 (Easily Visible)</li>
                                                    <li className="flex gap-2"><span className="w-16 font-mono font-medium text-foreground">Zone B:</span> q &gt; -0.014 (Visible, Perfect Conditions)</li>
                                                    <li className="flex gap-2"><span className="w-16 font-mono font-medium text-foreground">Zone C:</span> q &gt; -0.160 (May need Optical Aid)</li>
                                                </ul>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold">&nbsp;</p>
                                                <ul className="space-y-1 text-muted-foreground">
                                                    <li className="flex gap-2"><span className="w-16 font-mono font-medium text-foreground">Zone D:</span> q &gt; -0.232 (Optical Aid Only)</li>
                                                    <li className="flex gap-2"><span className="w-16 font-mono font-medium text-foreground">Zone E:</span> q &le; -0.232 (Invisible)</li>
                                                    <li className="flex gap-2"><span className="w-16 font-mono font-medium text-foreground">Zone F:</span> q &le; -0.293 (Impossible/Danjon Limit)</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4 text-primary" />
                                        <a href="https://webspace.science.uu.nl/~gent0113/islam/yallop.htm" target="_blank" className="text-primary hover:underline font-medium">Read Technical Note</a>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ODEH */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-foreground">Odeh's Criterion (2006)</h3>
                                <Badge variant="secondary" className="text-sm">Refined Polynomial</Badge>
                            </div>
                            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6 md:p-8 space-y-6">
                                    <p className="text-base text-foreground/90 leading-relaxed">
                                        Mohammad Odeh (ICOP) improved upon Yallop's work using a significantly larger dataset (737 observations).
                                        Unlike Yallop, Odeh typically uses <strong>topocentric</strong> values for altitude and width, which accounts for the observer's specific location on Earth's surface more accurately (parallax).
                                    </p>

                                    <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/20 space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300"><Calculator className="w-4 h-4" /> The Refined V-value Equation</div>
                                        <div className="font-mono text-sm md:text-base bg-background p-4 rounded-lg border shadow-sm overflow-x-auto whitespace-nowrap">
                                            V = ARCV - (7.1651 - 6.3226W + 0.7319W² - 0.1018W³)
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex gap-2 items-start">
                                                <Badge className="bg-green-600 hover:bg-green-700 mt-0.5">Key Difference</Badge>
                                                <p className="text-foreground/80 leading-snug">
                                                    The constant term was reduced from <strong>11.8371</strong> (Yallop) to <strong>7.1651</strong> (Odeh).
                                                    <br />This effectively <strong>lowers the bar</strong> for visibility. Odeh found Yallop's criterion rejected many valid sightings, particularly those made with binoculars or telescopes.
                                                </p>
                                            </div>
                                            <p className="text-muted-foreground pt-1">
                                                The zones (A-F) generally follow the same numeric boundaries as Yallop's q (using V), though the interpretation for optical aid vs naked eye is more specifically calibrated in Odeh's work.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <a href="https://astronomycenter.net/pdf/2006_cri.pdf" target="_blank" className="text-primary hover:underline font-medium">Download Odeh's Paper (PDF)</a>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* SAAO */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-foreground">SAAO Criterion (2001)</h3>
                                <Badge variant="secondary" className="text-sm">Linear Limit</Badge>
                            </div>
                            <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6 md:p-8 space-y-6">
                                    <p className="text-base text-foreground/90 leading-relaxed">
                                        Developed by Caldwell & Laney at the South African Astronomical Observatory.
                                        It simplifies the problem to a linear relationship evaluated <strong>at Sunset</strong> rather than a calculated "best time".
                                    </p>

                                    <div className="bg-orange-500/10 p-6 rounded-xl border border-orange-500/20 space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-orange-700 dark:text-orange-300"><Calculator className="w-4 h-4" /> The Linear Formula</div>
                                        <div className="font-mono text-sm md:text-base bg-background p-4 rounded-lg border shadow-sm overflow-x-auto whitespace-nowrap">
                                            Score = (Altitude at Sunset) + (Elongation / 3)
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4 text-sm pt-2">
                                            <div className="p-3 bg-background/50 rounded border border-orange-500/10">
                                                <span className="block font-bold text-orange-600 mb-1">Visible</span>
                                                Score &gt; 10 implies likely visibility (Naked Eye or mixed).
                                            </div>
                                            <div className="p-3 bg-background/50 rounded border border-orange-500/10">
                                                <span className="block font-bold text-orange-600 mb-1">Optical Aid</span>
                                                Score &gt; 9 may be possible with optical aid. <br /> Scores &lt; 9 are generally invisible.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-orange-500" />
                                        <a href="https://astronomycenter.net/pdf/saao_2001.pdf" target="_blank" className="text-primary hover:underline font-medium">Download SAAO Paper (PDF)</a>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* OZLEM */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-foreground">Özlem's Criterion (2014)</h3>
                                <Badge variant="secondary" className="text-sm">Physical/Contrast</Badge>
                            </div>
                            <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6 md:p-8 space-y-6">
                                    <p className="text-base text-foreground/90 leading-relaxed">
                                        A modern physical approach that moves away from empirical curve-fitting.
                                        Özlem's model calculates the actual <strong>contrast</strong> between the moon's surface brightness and the sky background brightness, factoring in atmospheric extinction.
                                    </p>

                                    <div className="bg-purple-500/10 p-6 rounded-xl border border-purple-500/20">
                                        <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Methodology</h4>
                                        <ul className="space-y-2 text-sm text-foreground/80 list-disc list-inside">
                                            <li>Does not rely on a fixed "Best Time".</li>
                                            <li>Iteratively checks contrast minute-by-minute after sunset.</li>
                                            <li>Determines visibility if the Moon-Sky contrast exceeds the human eye's detection threshold for a sufficient duration.</li>
                                            <li>Handles <strong>high-latitude</strong> and daylight visibility better than polynomial fits because it models the physics of light rather than just geometry.</li>
                                        </ul>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-purple-500" />
                                        <a href="https://astronomycenter.net/pdf/ozlem_2014.pdf" target="_blank" className="text-primary hover:underline font-medium">Download Özlem's Paper (PDF)</a>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </section>

                {/* 4. Comparison Table */}
                <section className="space-y-6 pb-8">
                    <h2 className="text-2xl font-semibold tracking-tight">At a Glance Comparison</h2>
                    <Card className="overflow-hidden border-border shadow-md">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-foreground font-semibold border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4">Criterion</th>
                                            <th className="px-6 py-4">Fundamental Approach</th>
                                            <th className="px-6 py-4">Best Use Case</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                        <tr className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-primary">Yallop</td>
                                            <td className="px-6 py-4 text-foreground/80">Empirical (Zone Classification)</td>
                                            <td className="px-6 py-4 text-muted-foreground">Conservative planning; traditional standard.</td>
                                        </tr>
                                        <tr className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-blue-500">Odeh</td>
                                            <td className="px-6 py-4 text-foreground/80">Refined Empirical (Optimized Constants)</td>
                                            <td className="px-6 py-4 text-muted-foreground">Accurate distinction between Naked Eye & Optical Aid.</td>
                                        </tr>
                                        <tr className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-orange-500">SAAO</td>
                                            <td className="px-6 py-4 text-foreground/80">Linear Threshold (Sunset-based)</td>
                                            <td className="px-6 py-4 text-muted-foreground">Rapid "back-of-envelope" verification.</td>
                                        </tr>
                                        <tr className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-purple-500">Özlem</td>
                                            <td className="px-6 py-4 text-foreground/80">Physical Contrast Model</td>
                                            <td className="px-6 py-4 text-muted-foreground">Research; edge cases (high latitude, daytime).</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </section>

            </div>
        </div>
    );
}

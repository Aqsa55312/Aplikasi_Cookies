import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Calculator, Construction, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export function CalculatorPage() {
  return (
    <AppLayout container className="bg-[#FDF8F5]">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#4A2B11]">HPP Calculator</h1>
          <p className="text-[#4A2B11]/60">Precise cost calculations for your boutique recipes.</p>
        </div>
        <Alert className="bg-[#F4A261]/10 border-[#F4A261]/20 text-[#4A2B11]">
          <Construction className="h-4 w-4 text-[#F4A261]" />
          <AlertTitle className="font-bold">Under Development</AlertTitle>
          <AlertDescription>
            The Recipe Builder and HPP calculation engine are being finalized for the next phase.
          </AlertDescription>
        </Alert>
        <Card className="border-none bg-white shadow-soft p-12 text-center">
          <CardHeader>
            <div className="h-20 w-20 rounded-full bg-[#FDF8F5] flex items-center justify-center mx-auto mb-6">
              <Calculator className="h-10 w-10 text-[#4A2B11]/20" />
            </div>
            <CardTitle className="text-2xl text-[#4A2B11]">Coming Soon</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              In Phase 2, you'll be able to build complex recipes, calculate labor costs, and see real-time profitability based on your ingredient stock prices.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4 mt-4">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
                {[
                  { title: "Dynamic Recipes", desc: "Link ingredients from your live pantry." },
                  { title: "Margin Analysis", desc: "Calculate retail price suggestions." },
                  { title: "Export Reports", desc: "Download PDF/Excel batch costs." }
                ].map((feature, i) => (
                  <div key={i} className="space-y-2 p-4 rounded-xl bg-[#FDF8F5]/50 border border-[#4A2B11]/5">
                    <p className="font-bold text-[#4A2B11] text-sm">{feature.title}</p>
                    <p className="text-xs text-[#4A2B11]/50 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-2 text-xs text-[#4A2B11]/40 justify-center">
          <Info className="h-3 w-3" />
          <span>Scheduled for release in Phase 2</span>
        </div>
      </div>
    </AppLayout>
  );
}
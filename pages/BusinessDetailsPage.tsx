import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { PageShell } from '../components/PageShell';
import { BusinessDetails, CommercialPackagingSetting } from '../types';
import { EGG_PACKAGING_OPTIONS } from '../constants';

export const BusinessDetailsPage: React.FC = () => {
  const { businessDetails: initialBusinessDetails, updateBusinessDetails, loading } = useData();
  const [details, setDetails] = useState<BusinessDetails>(initialBusinessDetails);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Synchronize local state with context, ensuring all packaging options are represented
  const syncPackagingSettings = useCallback((currentDetails: BusinessDetails): CommercialPackagingSetting[] => {
    return EGG_PACKAGING_OPTIONS.map(opt => {
      const existingSetting = currentDetails.commercialPackagingSettings?.find(s => s.packagingId === opt.id);
      return existingSetting || { packagingId: opt.id, isCommercialized: false, price: 0 };
    });
  }, []);

  useEffect(() => {
    setDetails(prevDetails => ({
        ...initialBusinessDetails,
        commercialPackagingSettings: syncPackagingSettings(initialBusinessDetails),
        defaultFreightCost: initialBusinessDetails.defaultFreightCost || 0,
    }));
  }, [initialBusinessDetails, syncPackagingSettings]);


  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails(prevDetails => ({
      ...prevDetails,
      [name]: (name === 'shedCount' || name === 'chickenCount' || name === 'defaultFreightCost') 
               ? parseFloat(value) || 0 
               : value,
    }));
  };

  const handlePackagingSettingChange = (packagingId: string, field: keyof CommercialPackagingSetting, value: string | number | boolean) => {
    setDetails(prevDetails => {
      const updatedSettings = prevDetails.commercialPackagingSettings.map(setting => {
        if (setting.packagingId === packagingId) {
          const newSetting = { ...setting, [field]: value };
          // If unchecking isCommercialized, reset price to 0 or keep it as is? Let's keep it.
          // if (field === 'isCommercialized' && value === false) {
          //   newSetting.price = 0;
          // }
          return newSetting;
        }
        return setting;
      });
      return { ...prevDetails, commercialPackagingSettings: updatedSettings };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setShowSuccessMessage(false);
    updateBusinessDetails(details);
    setTimeout(() => {
        setIsSaving(false);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
    }, 300);
  };
  
  if (loading && !initialBusinessDetails.farmName && initialBusinessDetails.commercialPackagingSettings.length === 0) {
     return <PageShell title="Dados da Granja"><div className="text-center p-10">Carregando dados...</div></PageShell>;
  }

  return (
    <PageShell title="Dados da Granja">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Farm Details */}
        <fieldset className="space-y-6 p-4 border border-slate-200 rounded-md">
            <legend className="text-lg font-semibold text-slate-700 px-2">Informações Gerais</legend>
            <div>
            <label htmlFor="farmName" className="block text-sm font-medium text-slate-700">
                Nome da Granja
            </label>
            <input
                type="text"
                name="farmName"
                id="farmName"
                value={details.farmName}
                onChange={handleDetailsChange}
                placeholder="Ex: Granja Sol Nascente"
                className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
            </div>

            <div>
            <label htmlFor="shedCount" className="block text-sm font-medium text-slate-700">
                Número de Galpões
            </label>
            <input
                type="number"
                name="shedCount"
                id="shedCount"
                value={details.shedCount}
                onChange={handleDetailsChange}
                min="0"
                placeholder="Ex: 3"
                className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
            </div>

            <div>
            <label htmlFor="chickenCount" className="block text-sm font-medium text-slate-700">
                Número Total de Galinhas
            </label>
            <input
                type="number"
                name="chickenCount"
                id="chickenCount"
                value={details.chickenCount}
                onChange={handleDetailsChange}
                min="0"
                placeholder="Ex: 5000"
                className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
            </div>

            <div>
            <label htmlFor="currentBatchAge" className="block text-sm font-medium text-slate-700">
                Idade do Lote Atual
            </label>
            <input
                type="text"
                name="currentBatchAge"
                id="currentBatchAge"
                value={details.currentBatchAge}
                onChange={handleDetailsChange}
                placeholder="Ex: 25 semanas"
                className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
            </div>
        </fieldset>

        {/* Commercial Packaging Settings */}
        <fieldset className="space-y-6 p-4 border border-slate-200 rounded-md">
            <legend className="text-lg font-semibold text-slate-700 px-2">Configurações de Embalagens e Preços</legend>
            {details.commercialPackagingSettings?.map((setting, index) => {
                const packagingOption = EGG_PACKAGING_OPTIONS.find(opt => opt.id === setting.packagingId);
                if (!packagingOption) return null; // Should not happen if synced correctly

                return (
                    <div key={setting.packagingId} className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                        <div className="flex items-center">
                            <input
                            type="checkbox"
                            id={`isCommercialized-${setting.packagingId}`}
                            checked={setting.isCommercialized}
                            onChange={(e) => handlePackagingSettingChange(setting.packagingId, 'isCommercialized', e.target.checked)}
                            className="h-5 w-5 text-sky-600 border-slate-300 rounded focus:ring-sky-500 mr-3"
                            />
                            <label htmlFor={`isCommercialized-${setting.packagingId}`} className="text-sm font-medium text-slate-700">
                            {packagingOption.label}
                            </label>
                        </div>
                        <div className="sm:ml-4 flex-shrink-0 sm:w-40">
                            <label htmlFor={`price-${setting.packagingId}`} className="sr-only">
                            Preço de Venda (R$)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    R$
                                </div>
                                <input
                                    type="number"
                                    name={`price-${setting.packagingId}`}
                                    id={`price-${setting.packagingId}`}
                                    value={setting.price}
                                    onChange={(e) => handlePackagingSettingChange(setting.packagingId, 'price', parseFloat(e.target.value) || 0)}
                                    disabled={!setting.isCommercialized}
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="mt-1 block w-full p-2 pl-10 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </fieldset>
        
        {/* Default Freight Cost */}
        <fieldset className="space-y-6 p-4 border border-slate-200 rounded-md">
            <legend className="text-lg font-semibold text-slate-700 px-2">Configuração de Frete</legend>
            <div>
                <label htmlFor="defaultFreightCost" className="block text-sm font-medium text-slate-700">
                    Valor do Frete Padrão (R$)
                </label>
                 <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        R$
                    </div>
                    <input
                    type="number"
                    name="defaultFreightCost"
                    id="defaultFreightCost"
                    value={details.defaultFreightCost}
                    onChange={handleDetailsChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full p-2 pl-10 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                </div>
                 <p className="mt-1 text-xs text-slate-500">Este valor será usado como padrão ao adicionar frete em uma venda de ovos. Pode ser alterado na transação.</p>
            </div>
        </fieldset>

        <div className="flex items-center space-x-4 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300"
          >
            {isSaving ? 'Salvando...' : 'Salvar Todas as Alterações'}
          </button>
          {showSuccessMessage && (
            <p className="text-sm text-emerald-600">Dados salvos com sucesso!</p>
          )}
        </div>
      </form>
    </PageShell>
  );
};

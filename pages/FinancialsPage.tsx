import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { PageShell } from '../components/PageShell';
import { Modal } from '../components/Modal';
import { ExportButton } from '../components/ExportButton';
import { Transaction, TransactionType, PaymentMethod, EggSaleDetails, CommercialPackagingSetting } from '../types';
import { PlusCircleIcon, REVENUE_CATEGORIES, EXPENSE_CATEGORIES, EGG_PACKAGING_OPTIONS } from '../constants';

const TransactionForm: React.FC<{ 
    onSave: (transaction: Omit<Transaction, 'id'>) => void; 
    onClose: () => void 
}> = ({ onSave, onClose }) => {
  const { businessDetails } = useData();

  const [type, setType] = useState<TransactionType>('revenue');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(''); // This will be dynamically calculated or manually set
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('pix');

  // Egg sales specific state
  const [selectedPackagingId, setSelectedPackagingId] = useState<string>('');
  const [packagingUnitsSold, setPackagingUnitsSold] = useState<string>('');
  
  // Freight specific state
  const [applyFreight, setApplyFreight] = useState<boolean>(false);
  const [transactionSpecificFreightCost, setTransactionSpecificFreightCost] = useState<string>('');
  
  // State to track if amount was manually edited by user
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState<boolean>(false);


  const categories = useMemo(() => {
    return type === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;
  }, [type]);

  const isEggSaleCategory = useMemo(() => {
    return type === 'revenue' && category === REVENUE_CATEGORIES[0]; // "Venda de Ovos"
  }, [type, category]);

  const commercializedPackagingOptions = useMemo(() => {
    return EGG_PACKAGING_OPTIONS.filter(opt => 
      businessDetails.commercialPackagingSettings.find(s => s.packagingId === opt.id && s.isCommercialized)
    );
  }, [businessDetails.commercialPackagingSettings]);

  // Effect to reset fields when type or category changes
  useEffect(() => {
    setCategory('');
    setSelectedPackagingId('');
    setPackagingUnitsSold('');
    setApplyFreight(false);
    setTransactionSpecificFreightCost('');
    setAmount(''); // Reset amount
    setIsAmountManuallyEdited(false); // Reset manual edit flag
    // Ensure paymentMethod has a default
    if (!paymentMethod) setPaymentMethod('pix');
  }, [type, paymentMethod]);

  useEffect(() => {
    if (!isEggSaleCategory) {
      setSelectedPackagingId('');
      setPackagingUnitsSold('');
      setApplyFreight(false);
      setTransactionSpecificFreightCost('');
      setAmount('');
      setIsAmountManuallyEdited(false);
    } else {
        // Pre-fill freight cost if applyFreight is true and field is empty
        if (applyFreight && transactionSpecificFreightCost === '') {
            setTransactionSpecificFreightCost(businessDetails.defaultFreightCost > 0 ? businessDetails.defaultFreightCost.toFixed(2) : '');
        }
    }
  }, [isEggSaleCategory, applyFreight, businessDetails.defaultFreightCost]); // Removed transactionSpecificFreightCost from deps to avoid loop

  // Effect for automatic amount calculation
  useEffect(() => {
    if (isAmountManuallyEdited || !isEggSaleCategory) return;

    let calculatedAmount = 0;
    const units = parseInt(packagingUnitsSold, 10);

    if (selectedPackagingId && units > 0) {
      const packagingSetting = businessDetails.commercialPackagingSettings.find(
        s => s.packagingId === selectedPackagingId && s.isCommercialized
      );
      if (packagingSetting) {
        calculatedAmount += packagingSetting.price * units;
      }
    }

    if (applyFreight) {
      const freightCost = parseFloat(transactionSpecificFreightCost.replace(',', '.')) || 0;
      calculatedAmount += freightCost;
    }
    
    setAmount(calculatedAmount > 0 ? calculatedAmount.toFixed(2) : '');

  }, [
    selectedPackagingId, 
    packagingUnitsSold, 
    applyFreight, 
    transactionSpecificFreightCost, 
    isEggSaleCategory, 
    businessDetails,
    isAmountManuallyEdited // Depend on this to stop auto-calculation if user edits manually
  ]);
  
  const handleAmountChange = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const num = parseFloat(value.replace(',', '.'));
    if (!isNaN(num)) {
        setAmount(num.toFixed(2));
    } else {
        setAmount('');
    }
    setIsAmountManuallyEdited(true); // User has manually changed the amount
  };
  
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value); // Allow typing freely
    // Do not set isAmountManuallyEdited here, only onBlur or if calculation logic changes
  };


  const calculatedEggsToBeDebited = useMemo(() => {
    if (!isEggSaleCategory || !selectedPackagingId || !packagingUnitsSold) return 0;
    const packagingOption = EGG_PACKAGING_OPTIONS.find(opt => opt.id === selectedPackagingId);
    if (!packagingOption) return 0;
    return (parseInt(packagingUnitsSold, 10) || 0) * packagingOption.eggsPerUnit;
  }, [isEggSaleCategory, selectedPackagingId, packagingUnitsSold]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !paymentMethod || !category) {
      alert('Por favor, preencha todos os campos obrigatórios: Descrição, Valor Total, Data, Forma de Pagamento e Categoria.');
      return;
    }
    
    const finalAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(finalAmount) || finalAmount <= 0) {
        alert('Por favor, insira um valor monetário válido e positivo.');
        return;
    }

    let eggSaleDetails: EggSaleDetails | undefined = undefined;
    let finalDescription = description;
    let freightCostApplied: number | undefined = undefined;

    if (isEggSaleCategory) {
      if (!selectedPackagingId || !packagingUnitsSold || parseInt(packagingUnitsSold, 10) <= 0) {
        alert('Para "Venda de Ovos", selecione o Tipo de Embalagem e informe a Quantidade (maior que zero).');
        return;
      }
      const packagingOptionData = EGG_PACKAGING_OPTIONS.find(opt => opt.id === selectedPackagingId);
      if (packagingOptionData) {
        const units = parseInt(packagingUnitsSold, 10);
        eggSaleDetails = {
          packagingId: selectedPackagingId,
          packagingLabel: packagingOptionData.label,
          unitsSold: units,
          totalEggsSold: units * packagingOptionData.eggsPerUnit,
        };
        finalDescription = `${description} (${units}x ${packagingOptionData.label})`;
      }
      if (applyFreight) {
        freightCostApplied = parseFloat(transactionSpecificFreightCost.replace(',', '.')) || 0;
        if (freightCostApplied > 0) {
            finalDescription += ` (+ Frete R$ ${freightCostApplied.toFixed(2)})`;
        }
      }
    }

    const transactionData: Omit<Transaction, 'id'> = { 
      type, 
      date, 
      description: finalDescription, 
      amount: finalAmount, 
      category,
      paymentMethod,
      eggSaleDetails,
      freightCostApplied,
    };
    
    onSave(transactionData);
    onClose(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-slate-700">Tipo <span className="text-red-500">*</span></label>
        <select 
          id="type" 
          value={type} 
          onChange={(e) => { setType(e.target.value as TransactionType); setIsAmountManuallyEdited(false); }}
          className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="revenue">Receita</option>
          <option value="expense">Despesa</option>
        </select>
      </div>

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700">Forma de Pagamento <span className="text-red-500">*</span></label>
        <select 
          id="paymentMethod" 
          value={paymentMethod} 
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | '')} 
          required
          className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="" disabled>Selecione...</option>
          <option value="pix">Pix</option>
          <option value="cash">Dinheiro</option>
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-slate-700">Data <span className="text-red-500">*</span></label>
        <input 
          type="date" 
          id="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          required 
          className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
        />
      </div>
       <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">Categoria <span className="text-red-500">*</span></label>
        <select
          id="category"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setIsAmountManuallyEdited(false); }}
          required
          className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        >
          <option value="" disabled>Selecione uma categoria...</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      {isEggSaleCategory && (
        <>
          <div>
            <label htmlFor="selectedPackagingId" className="block text-sm font-medium text-slate-700">Tipo de Embalagem <span className="text-red-500">*</span></label>
            <select
              id="selectedPackagingId"
              value={selectedPackagingId}
              onChange={(e) => { setSelectedPackagingId(e.target.value); setIsAmountManuallyEdited(false); }}
              required
              className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option value="" disabled>Selecione a embalagem...</option>
              {commercializedPackagingOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="packagingUnitsSold" className="block text-sm font-medium text-slate-700">Quantidade de Embalagens <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="packagingUnitsSold"
              value={packagingUnitsSold}
              onChange={(e) => { setPackagingUnitsSold(e.target.value); setIsAmountManuallyEdited(false); }}
              min="1"
              required
              placeholder="Ex: 10"
              className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
          {calculatedEggsToBeDebited > 0 && (
            <p className="text-sm text-sky-700 mt-1">
              Esta transação debitará {calculatedEggsToBeDebited} ovos do estoque.
            </p>
          )}
          <div className="mt-2 space-y-2">
            <div className="flex items-center">
                <input 
                    type="checkbox"
                    id="applyFreight"
                    checked={applyFreight}
                    onChange={(e) => { 
                        setApplyFreight(e.target.checked); 
                        setIsAmountManuallyEdited(false); 
                        if (e.target.checked && transactionSpecificFreightCost === '' && businessDetails.defaultFreightCost > 0) {
                            setTransactionSpecificFreightCost(businessDetails.defaultFreightCost.toFixed(2));
                        } else if (!e.target.checked) {
                            // setTransactionSpecificFreightCost(''); // Keep value if user unchecks, they might recheck.
                        }
                    }}
                    className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                />
                <label htmlFor="applyFreight" className="ml-2 block text-sm text-slate-700">Adicionar Frete?</label>
            </div>
            {applyFreight && (
                <div>
                    <label htmlFor="transactionSpecificFreightCost" className="block text-sm font-medium text-slate-700">Valor do Frete (R$)</label>
                    <input
                        type="text"
                        id="transactionSpecificFreightCost"
                        value={transactionSpecificFreightCost}
                        onChange={(e) => {
                            setTransactionSpecificFreightCost(e.target.value);
                            setIsAmountManuallyEdited(false); // Recalculate total amount
                        }}
                        onBlur={(e) => { // Format on blur
                            const val = parseFloat(e.target.value.replace(',', '.'));
                            setTransactionSpecificFreightCost(!isNaN(val) && val > 0 ? val.toFixed(2) : '');
                            setIsAmountManuallyEdited(false);
                        }}
                        placeholder="0.00"
                        className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                </div>
            )}
          </div>
        </>
      )}

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Descrição <span className="text-red-500">*</span></label>
        <input 
          type="text" 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          required 
          placeholder={type === 'expense' ? "Ex: Compra de ração" : (isEggSaleCategory ? "Ex: Venda para cliente X" : "Ex: Venda de aves")}
          className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Valor Total (R$) <span className="text-red-500">*</span></label>
        <input 
          type="text" 
          id="amount" 
          value={amount} 
          onChange={handleAmountInputChange}
          onBlur={handleAmountChange} // Sets isAmountManuallyEdited to true
          required 
          placeholder="0.00" 
          className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
        />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md">Salvar Transação</button>
      </div>
    </form>
  );
};

export const FinancialsPage: React.FC = () => {
  const { transactions, addTransaction, loading } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  if (loading && transactions.length === 0) { 
    return <PageShell title="Controle Financeiro"><div className="text-center p-10">Carregando dados...</div></PageShell>;
  }

  const formatPaymentMethod = (method?: PaymentMethod) => {
    if (!method) return '-';
    if (method === 'pix') return 'Pix';
    if (method === 'cash') return 'Dinheiro';
    return method; 
  };

  return (
    <PageShell 
      title="Controle Financeiro"
      actions={
        <>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-150 flex items-center text-sm"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Nova Transação
          </button>
          <ExportButton dataType="financial" />
        </>
      }
    >
      {transactions.length === 0 ? (
        <p className="text-slate-500 text-center py-8">Nenhuma transação registrada ainda. Clique em "Nova Transação" para começar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Forma Pag.</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Categoria</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Valor</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {sortedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">{new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-4 text-sm text-slate-900 font-medium max-w-xs">
                    <div className="truncate" title={transaction.description}>{transaction.description}</div>
                    {typeof transaction.freightCostApplied === 'number' && transaction.freightCostApplied > 0 && (
                        <div className="text-xs text-slate-500">Frete: {transaction.freightCostApplied.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'revenue' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'revenue' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatPaymentMethod(transaction.paymentMethod)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{transaction.category || '-'}</td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                    transaction.type === 'revenue' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Transação">
        {isModalOpen && <TransactionForm onSave={addTransaction} onClose={() => setIsModalOpen(false)} />}
      </Modal>
    </PageShell>
  );
};
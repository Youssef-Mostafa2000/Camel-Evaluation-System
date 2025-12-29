import { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronsUpDown } from 'lucide-react';
import { countries, getCountryFlag } from '../lib/countries';

interface PhoneCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PhoneCodeSelect({ value, onChange, className = '' }: PhoneCodeSelectProps) {
  const [query, setQuery] = useState('');

  const filteredCountries =
    query === ''
      ? countries
      : countries.filter((country) =>
          (country.dialCode + country.name + country.code)
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, ''))
        );

  return (
    <Combobox value={value} onChange={onChange}>
      <div className={`relative ${className}`}>
        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white border border-gray-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
          <Combobox.Input
            className="w-full border-none py-2 pl-3 pr-8 text-sm leading-5 text-gray-900 focus:ring-0 outline-none"
            displayValue={(dialCode: string) => {
              const country = countries.find((c) => c.dialCode === dialCode);
              return country ? `${getCountryFlag(country.code)} ${country.dialCode}` : '';
            }}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredCountries.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Nothing found.
              </div>
            ) : (
              filteredCountries.map((country) => (
                <Combobox.Option
                  key={country.code}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 px-4 ${
                      active ? 'bg-primary-600 text-white' : 'text-gray-900'
                    }`
                  }
                  value={country.dialCode}
                >
                  {({ selected }) => (
                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                      <span className="text-lg mr-2">{getCountryFlag(country.code)}</span>
                      <span className="font-semibold">{country.dialCode}</span>
                      <span className="text-gray-500 ml-2 text-xs">{country.name}</span>
                    </span>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}

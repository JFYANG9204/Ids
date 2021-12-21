#include "mdmxmltypes.h"


template<typename T>
void FreeVector(vector<T>* v)
{
    if (is_pointer<T>())
    {
        for (auto it = v->begin(); it != v->end(); it++)
        {
            delete *it;
            v->erase(it);
        }
    }
    delete v;
}



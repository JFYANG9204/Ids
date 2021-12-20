#pragma once

#include "tinyxml/tinyxml.h"



/*
*  XML树遍历方法，广度优先遍历
*  function参数可传入返回值为bool的匿名方法
*/
template<class _Fn>
void ErgodicXmlElementDescendant(const TiXmlElement* element, _Fn function)
{
    if (element == NULL) return;
    if (function(element)) return;
    ErgodicXmlElementDescendant(element->NextSibling(), function);
    ErgodicXmlElementDescendant(element->firstChild(), function);
}




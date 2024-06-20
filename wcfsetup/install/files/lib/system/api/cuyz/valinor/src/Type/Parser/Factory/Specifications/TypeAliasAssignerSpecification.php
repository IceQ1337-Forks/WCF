<?php

declare(strict_types=1);

namespace CuyZ\Valinor\Type\Parser\Factory\Specifications;

use CuyZ\Valinor\Type\Parser\Factory\TypeParserFactory;
use CuyZ\Valinor\Type\Parser\Lexer\Token\TraversingToken;
use CuyZ\Valinor\Type\Parser\Lexer\Token\TypeToken;
use CuyZ\Valinor\Type\Parser\TypeParser;
use CuyZ\Valinor\Type\Type;

/** @internal */
final class TypeAliasAssignerSpecification implements TypeParserSpecification
{
    public function __construct(
        /** @var array<string, Type> */
        private array $aliases,
    ) {}

    public function manipulateToken(TraversingToken $token): TraversingToken
    {
        $symbol = $token->symbol();

        if (isset($this->aliases[$symbol])) {
            return new TypeToken($this->aliases[$symbol], $symbol);
        }

        return $token;
    }

    public function manipulateParser(TypeParser $parser, TypeParserFactory $typeParserFactory): TypeParser
    {
        return $parser;
    }
}

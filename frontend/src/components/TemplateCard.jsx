import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Eye } from "lucide-react";
import PropTypes from "prop-types";

const TemplateCard = ({ template }) => {
  const authorInitials = template.author.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Card className="flex flex-col hover:shadow-lg dark:hover:shadow-accent transition dark:bg-zinc-700 dark:border-slate-100">
      <CardHeader>
        <CardTitle>
          <Link
            to={`/templates/${template.id}`}
            className="text-accent text-xl font-bold hover:underline"
          >
            {template.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2 border-1 text-gray-700 font-medium dark:text-slate-100 mb-4">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 float-end">
          <div className="flex flex-col justify-end text-right">
            <span className="text-sm text-slate-600 font-semibold dark:text-slate-100 ml-2 leading-4 capitalize">
              {template.author.name}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-100">
              {new Date(template.createdAt).toLocaleDateString()}
            </span>
          </div>
          <Avatar>
            <AvatarFallback className="bg-accent uppercase text-slate-100 dark:bg-slate-100 dark:text-accent font-bold">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex justify-between items-center">
        <div className="flex items-center text-sm font-medium text-gray-500 dark:text-slate-100">
          <Heart className="mr-1 text-red-500" fill="#ff6666" />
          {template._count.likes}{" "}
          {/* {template._count.likes === 1 ? "Like" : "Likes"} */}
        </div>
        <Link to={`/templates/${template.id}`}>
          <Button className="rounded-2xl">
            <Eye className="h-5 w-5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

TemplateCard.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    author: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }).isRequired,
    createdAt: PropTypes.string.isRequired,
    _count: PropTypes.shape({
      likes: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};

export default React.memo(TemplateCard);
